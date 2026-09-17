import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCredentials,
  secretsMatch,
  looksLikeAnthropicKey,
  OWNER,
  BYOK,
  PASSPHRASE_HEADER,
  KEY_HEADER,
} from '../api/_lib/auth.js';
import { takeToken, checkOrigin, __resetBuckets } from '../api/_lib/guard.js';

const OWNER_KEY = 'sk-ant-server0000000000000000000000';
const VISITOR_KEY = 'sk-ant-visitor00000000000000000000';
// Must be >= MIN_PASSPHRASE_LENGTH or owner access is disabled by design.
const PASS = 'correct-horse-battery-staple-9f3a';

function req(headers = {}) {
  return { headers };
}

function withEnv(env, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('secretsMatch is correct and length-safe', () => {
  assert.equal(secretsMatch('abc', 'abc'), true);
  assert.equal(secretsMatch('abc', 'abd'), false);
  // Different lengths must return false, not throw — timingSafeEqual throws on
  // mismatched buffer widths, which is why both sides are hashed first.
  assert.doesNotThrow(() => secretsMatch('a', 'a much longer secret'));
  assert.equal(secretsMatch('a', 'a much longer secret'), false);
  for (const bad of ['', null, undefined, 0, {}]) {
    assert.equal(secretsMatch(bad, 'x'), false);
    assert.equal(secretsMatch('x', bad), false);
  }
});

test('key shape check rejects wrong-provider and malformed keys', () => {
  assert.equal(looksLikeAnthropicKey(VISITOR_KEY), true);
  assert.equal(looksLikeAnthropicKey(`  ${VISITOR_KEY}  `), true);
  assert.equal(looksLikeAnthropicKey('sk-proj-abcdefghijklmnopqrstuv'), false, 'OpenAI key');
  assert.equal(looksLikeAnthropicKey('sk-ant-short'), false);
  assert.equal(looksLikeAnthropicKey(''), false);
  assert.equal(looksLikeAnthropicKey(null), false);
});

// The whole point of this change: no credential, no spend.
test('a request with no credentials is refused', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req()), (e) => {
      assert.equal(e.status, 401);
      assert.equal(e.code, 'credentials_required');
      return true;
    });
  });
});

test('the owner passphrase unlocks the server key', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    const { apiKey, source } = resolveCredentials(req({ [PASSPHRASE_HEADER]: PASS }));
    assert.equal(apiKey, OWNER_KEY);
    assert.equal(source, OWNER);
  });
});

test('a wrong passphrase never reaches the server key', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req({ [PASSPHRASE_HEADER]: 'guess' })), (e) => {
      assert.equal(e.status, 401);
      assert.equal(e.code, 'bad_passphrase');
      return true;
    });
  });
});

// If the env var is missing the server key must become UNREACHABLE, not free.
test('an unset OWNER_PASSPHRASE fails closed', () => {
  withEnv({ OWNER_PASSPHRASE: undefined, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req({ [PASSPHRASE_HEADER]: 'anything' })), (e) => {
      assert.equal(e.code, 'owner_access_unavailable');
      return true;
    });
    // And no-credential requests are still refused rather than falling back.
    assert.throws(() => resolveCredentials(req()), (e) => {
      assert.equal(e.code, 'credentials_required');
      return true;
    });
  });
});

test('a short passphrase disables owner access entirely', () => {
  // Entropy is the real control: a guessable secret must not guard a billing
  // account, so a too-short value is treated as if it were never configured.
  withEnv({ OWNER_PASSPHRASE: 'hunter2', ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req({ [PASSPHRASE_HEADER]: 'hunter2' })), (e) => {
      assert.equal(e.code, 'owner_access_unavailable');
      return true;
    });
  });
});

test('an empty-string OWNER_PASSPHRASE cannot be matched', () => {
  withEnv({ OWNER_PASSPHRASE: '', ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req({ [PASSPHRASE_HEADER]: '' })), (e) => {
      // An empty header is treated as absent, so this is the no-credentials path.
      assert.equal(e.code, 'credentials_required');
      return true;
    });
  });
});

test('a visitor key is used as-is and never swapped for the server key', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    const { apiKey, source } = resolveCredentials(req({ [KEY_HEADER]: VISITOR_KEY }));
    assert.equal(apiKey, VISITOR_KEY);
    assert.notEqual(apiKey, OWNER_KEY);
    assert.equal(source, BYOK);
  });
});

test('a malformed visitor key is rejected before any upstream call', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    assert.throws(() => resolveCredentials(req({ [KEY_HEADER]: 'sk-proj-openai-style-key-here' })), (e) => {
      assert.equal(e.status, 400);
      assert.equal(e.code, 'malformed_key');
      return true;
    });
  });
});

test('a visitor cannot smuggle the server key by sending both headers', () => {
  withEnv({ OWNER_PASSPHRASE: PASS, ANTHROPIC_API_KEY: OWNER_KEY }, () => {
    // Wrong passphrase plus a valid own key must fail, not silently downgrade
    // to BYOK — otherwise the passphrase is a free brute-force oracle.
    assert.throws(
      () => resolveCredentials(req({ [PASSPHRASE_HEADER]: 'wrong', [KEY_HEADER]: VISITOR_KEY })),
      (e) => {
        assert.equal(e.code, 'bad_passphrase');
        return true;
      },
    );
  });
});

test('origin check allows same-origin and blocks other sites', () => {
  withEnv({ ALLOWED_ORIGINS: undefined }, () => {
    assert.doesNotThrow(() => checkOrigin(req()), 'no Origin header is allowed');
    assert.doesNotThrow(() =>
      checkOrigin(req({ origin: 'https://reg-ready.vercel.app', host: 'reg-ready.vercel.app' })));
    assert.throws(
      () => checkOrigin(req({ origin: 'https://evil.example', host: 'reg-ready.vercel.app' })),
      (e) => {
        assert.equal(e.status, 403);
        return true;
      },
    );
  });
});

// This is the regression that took the live site down: VERCEL_URL holds the
// deployment hostname, never the production alias, so an allow-list built from
// it rejected every genuine visitor. Same-origin must be decided against Host.
test('origin check works on any hostname with nothing configured', () => {
  withEnv({ ALLOWED_ORIGINS: undefined, VERCEL_URL: 'regready-abc123.vercel.app' }, () => {
    for (const host of [
      'reg-ready.vercel.app',
      'regready-abc123.vercel.app',
      'regready-git-main-del.vercel.app',
      'regready.com',
    ]) {
      assert.doesNotThrow(
        () => checkOrigin(req({ origin: `https://${host}`, host })),
        `${host} must be able to call its own API`,
      );
    }
    // localhost over plain http during local dev.
    assert.doesNotThrow(() =>
      checkOrigin(req({ origin: 'http://localhost:4173', host: 'localhost:4173' })));
  });
});

test('extra origins can still be allow-listed explicitly', () => {
  withEnv({ ALLOWED_ORIGINS: 'https://docs.example' }, () => {
    assert.doesNotThrow(() =>
      checkOrigin(req({ origin: 'https://docs.example', host: 'reg-ready.vercel.app' })));
  });
});

test('token bucket drains then refills', () => {
  __resetBuckets();
  const opts = { capacity: 3, refillPerSecond: 1, now: 1_000_000 };
  assert.equal(takeToken('t', 'ip', opts), 0);
  assert.equal(takeToken('t', 'ip', opts), 0);
  assert.equal(takeToken('t', 'ip', opts), 0);
  assert.ok(takeToken('t', 'ip', opts) > 0, 'fourth call in the same instant is refused');

  // A different identity has its own budget.
  assert.equal(takeToken('t', 'other-ip', opts), 0);

  // After two seconds, two tokens are back.
  assert.equal(takeToken('t', 'ip', { ...opts, now: 1_002_000 }), 0);
  assert.equal(takeToken('t', 'ip', { ...opts, now: 1_002_000 }), 0);
});
