import { UpstreamError } from './claude.js';

/**
 * Request guards for the paid endpoints.
 *
 * Be clear about what these are worth. `curl` sets any header it likes, so the
 * origin check is not a security boundary against a determined attacker — it
 * stops other *websites* calling this API from their visitors' browsers, and it
 * turns away drive-by scripts that do not bother to spoof. And because a Vercel
 * deployment runs many independent instances, the in-memory limiter below only
 * sees the slice of traffic that lands on one warm instance.
 *
 * The real protection is architectural: without the owner passphrase nobody can
 * reach the server key at all, so abuse costs the abuser their own money. These
 * guards exist to raise the floor — above all to make the passphrase expensive
 * to guess.
 */

function header(req, name) {
  const v = req?.headers?.[name] ?? req?.headers?.get?.(name);
  return typeof v === 'string' ? v.trim() : '';
}

function extraAllowedOrigins() {
  return new Set(
    (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Reject cross-site browser calls.
 *
 * Same-origin is decided by comparing the browser's Origin against the Host it
 * actually sent the request to. That is correct on every hostname the app can
 * be served from — the production alias, a preview deployment, a custom domain,
 * localhost — with nothing to configure.
 *
 * Do NOT reintroduce an allow-list built from VERCEL_URL. That variable holds
 * the deployment-specific hostname (regready-abc123.vercel.app), never the
 * production alias, so it rejected every real visitor while looking configured.
 *
 * A request with no Origin at all is allowed: that is a same-origin non-CORS
 * POST, a server-side caller, or curl — none of which this header distinguishes.
 */
export function checkOrigin(req) {
  const origin = header(req, 'origin');
  if (!origin) return;

  const host = header(req, 'host');
  if (host && (origin === `https://${host}` || origin === `http://${host}`)) return;

  if (extraAllowedOrigins().has(origin)) return;

  throw new UpstreamError('Requests from this origin are not allowed.', {
    status: 403,
    code: 'origin_not_allowed',
  });
}

// bucketName -> Map<identity, {tokens, updated}>
const buckets = new Map();

/**
 * Best-effort token bucket, scoped to one warm instance. Returns seconds to
 * wait when empty, or 0 when the call may proceed.
 */
export function takeToken(bucketName, identity, { capacity, refillPerSecond, now = Date.now() }) {
  if (!buckets.has(bucketName)) buckets.set(bucketName, new Map());
  const bucket = buckets.get(bucketName);

  // Keep the map from growing without bound on a long-lived warm instance.
  if (bucket.size > 5000) bucket.clear();

  const entry = bucket.get(identity) || { tokens: capacity, updated: now };
  const elapsed = Math.max(0, now - entry.updated) / 1000;
  const tokens = Math.min(capacity, entry.tokens + elapsed * refillPerSecond);

  if (tokens < 1) {
    bucket.set(identity, { tokens, updated: now });
    return Math.ceil((1 - tokens) / refillPerSecond);
  }

  bucket.set(identity, { tokens: tokens - 1, updated: now });
  return 0;
}

export function clientIp(req) {
  const fwd = req?.headers?.['x-forwarded-for'] || req?.headers?.get?.('x-forwarded-for');
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req?.socket?.remoteAddress || 'unknown';
}

/**
 * Throttle wrong-passphrase attempts hard. This is the guard that matters most:
 * the passphrase is the only route to the owner's billing account, so guessing
 * it must be slow. Ten wrong tries then one per minute, per instance.
 */
export function recordAuthFailure(req) {
  const wait = takeToken('auth', clientIp(req), { capacity: 10, refillPerSecond: 1 / 60 });
  if (wait > 0) {
    throw new UpstreamError('Too many failed attempts. Try again shortly.', {
      status: 429,
      code: 'too_many_attempts',
    });
  }
}

/**
 * Throttle successful analyses per IP. Deliberately generous — a real user
 * running several assessments should never hit it — and only a speed bump for
 * anyone spending their own key anyway.
 */
export function checkCallRate(req, source) {
  const wait = takeToken(`call:${source}`, clientIp(req), {
    capacity: 20,
    refillPerSecond: 1 / 15,
  });
  if (wait > 0) {
    throw new UpstreamError(`Rate limit reached. Try again in ${wait}s.`, {
      status: 429,
      code: 'rate_limited',
    });
  }
}

/** Test seam: reset all buckets. */
export function __resetBuckets() {
  buckets.clear();
}
