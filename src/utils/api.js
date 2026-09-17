import { authHeaders } from './credentials';

/** Thrown when the request needs credentials the visitor has not supplied. */
export class CredentialsError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CredentialsError';
    this.code = code;
  }
}

const CREDENTIAL_CODES = new Set([
  'credentials_required',
  'bad_passphrase',
  'malformed_key',
  'key_rejected',
  'owner_access_unavailable',
  'permission_denied',
]);

export async function analyzeInput(mode, input) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ mode, input }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data.error || `Request failed with status ${response.status}`;
    if (CREDENTIAL_CODES.has(data.code)) {
      throw new CredentialsError(message, data.code);
    }
    throw new Error(message);
  }

  return response.json();
}
