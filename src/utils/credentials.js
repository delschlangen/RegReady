// Where the browser keeps whatever the visitor chose to supply.
//
// These live in localStorage, which means: this browser only, never sent
// anywhere except this site's own /api routes, and gone when the visitor
// clears them. The app renders all model output through React with no
// dangerouslySetInnerHTML, so there is no injection sink that could read them
// back out.

const KEY_STORE = 'regready.anthropicKey';
const PASS_STORE = 'regready.ownerPassphrase';

// localStorage throws in some private-browsing modes and is absent in SSR.
function safeGet(name) {
  try {
    return window.localStorage.getItem(name) || '';
  } catch {
    return '';
  }
}

function safeSet(name, value) {
  try {
    if (value) window.localStorage.setItem(name, value);
    else window.localStorage.removeItem(name);
    return true;
  } catch {
    return false;
  }
}

export function getApiKey() {
  return safeGet(KEY_STORE);
}

export function getPassphrase() {
  return safeGet(PASS_STORE);
}

export function setApiKey(key) {
  return safeSet(KEY_STORE, (key || '').trim());
}

export function setPassphrase(phrase) {
  return safeSet(PASS_STORE, (phrase || '').trim());
}

export function clearCredentials() {
  safeSet(KEY_STORE, '');
  safeSet(PASS_STORE, '');
}

export function hasCredentials() {
  return Boolean(getApiKey() || getPassphrase());
}

/** 'owner' when a passphrase is set, 'byok' with a key, otherwise null. */
export function credentialMode() {
  if (getPassphrase()) return 'owner';
  if (getApiKey()) return 'byok';
  return null;
}

/** Show a key as sk-ant-…a1b2 so someone can tell which one is loaded. */
export function maskKey(key) {
  const k = (key || '').trim();
  if (!k) return '';
  if (k.length <= 14) return 'sk-ant-…';
  return `${k.slice(0, 7)}…${k.slice(-4)}`;
}

export function looksLikeAnthropicKey(key) {
  return /^sk-ant-[A-Za-z0-9_-]{16,}$/.test((key || '').trim());
}

/** Credential headers for a fetch to this site's own API. Never send elsewhere. */
export function authHeaders() {
  const headers = {};
  const pass = getPassphrase();
  const key = getApiKey();
  // The passphrase wins: if the owner has both, spend the server key.
  if (pass) headers['x-regready-passphrase'] = pass;
  else if (key) headers['x-anthropic-key'] = key;
  return headers;
}
