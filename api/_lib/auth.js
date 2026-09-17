import { createHash, timingSafeEqual } from 'node:crypto';
import { UpstreamError } from './claude.js';

export const OWNER = 'owner';
export const BYOK = 'byok';

export const PASSPHRASE_HEADER = 'x-regready-passphrase';
export const KEY_HEADER = 'x-anthropic-key';

// A per-instance rate limiter cannot stop a distributed guessing attack against
// a stateless serverless deployment, so entropy has to carry the weight. A
// passphrase shorter than this disables owner access entirely rather than
// pretending to protect the billing account behind it.
export const MIN_PASSPHRASE_LENGTH = 24;

/** The configured owner passphrase, or null if unset or too weak to rely on. */
export function ownerPassphrase() {
  const p = process.env.OWNER_PASSPHRASE;
  return typeof p === 'string' && p.length >= MIN_PASSPHRASE_LENGTH ? p : null;
}

/**
 * Compare two secrets without leaking their length or contents through timing.
 * Hashing first gives both sides a fixed 32-byte width, so timingSafeEqual
 * never throws on a length mismatch and the comparison itself reveals nothing.
 */
export function secretsMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Anthropic keys look like sk-ant-... . This is a shape check to catch typos
 * and wrong-provider pastes before spending a round trip — it is NOT
 * validation. Only Anthropic can say whether a key is real.
 */
export function looksLikeAnthropicKey(key) {
  return typeof key === 'string' && /^sk-ant-[A-Za-z0-9_-]{16,}$/.test(key.trim());
}

function header(req, name) {
  const v = req?.headers?.[name] ?? req?.headers?.get?.(name);
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Decide which Anthropic key, if any, this request is allowed to spend.
 *
 * Two ways in:
 *   1. The owner proves knowledge of OWNER_PASSPHRASE and spends the server key.
 *   2. Anyone supplies their own key and spends their own money.
 *
 * Fails CLOSED: if OWNER_PASSPHRASE is unset the server key is unreachable by
 * anyone, rather than becoming free for everyone. That is deliberate — an
 * env var that silently opens the owner's billing account when missing is the
 * exact failure this whole change exists to prevent.
 *
 * Returns { apiKey, source }. Throws UpstreamError otherwise. The returned key
 * must never be logged, echoed, or stored.
 */
export function resolveCredentials(req) {
  const supplied = header(req, KEY_HEADER);
  const passphrase = header(req, PASSPHRASE_HEADER);
  const configured = ownerPassphrase();
  const serverKey = process.env.ANTHROPIC_API_KEY;

  if (passphrase) {
    if (!configured) {
      throw new UpstreamError(
        'Owner access is not configured on this deployment.',
        { status: 401, code: 'owner_access_unavailable' },
      );
    }
    if (!secretsMatch(passphrase, configured)) {
      throw new UpstreamError('That passphrase is not correct.', {
        status: 401,
        code: 'bad_passphrase',
      });
    }
    if (!serverKey) {
      throw new UpstreamError(
        'Owner passphrase accepted, but this deployment has no ANTHROPIC_API_KEY configured.',
        { status: 500, code: 'server_key_missing' },
      );
    }
    return { apiKey: serverKey, source: OWNER };
  }

  if (supplied) {
    if (!looksLikeAnthropicKey(supplied)) {
      throw new UpstreamError(
        'That does not look like an Anthropic API key. Keys start with "sk-ant-".',
        { status: 400, code: 'malformed_key' },
      );
    }
    return { apiKey: supplied, source: BYOK };
  }

  throw new UpstreamError(
    'This analysis runs on the Anthropic API. Add your own API key in Settings, or enter the owner passphrase.',
    { status: 401, code: 'credentials_required' },
  );
}

/**
 * Responses produced with a caller-supplied key must never be cached by the
 * CDN — a shared cache entry would serve one visitor's paid result to another,
 * and key-specific rate-limit or error responses would stick.
 */
export function applyPrivacyHeaders(res, source) {
  if (source === BYOK) {
    res.setHeader('Cache-Control', 'private, no-store');
  }
}
