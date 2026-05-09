import crypto from 'node:crypto';

const SECRET = process.env.QR_HMAC_SECRET || 'dev-secret';

// Canonical JSON : keys sorted to make signing deterministic across clients.
function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
}

export function signPayload(payload) {
  const body = canonicalize(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  return { ...payload, sig };
}

export function verifyPayload(signed) {
  if (!signed || typeof signed !== 'object' || !signed.sig) return false;
  const { sig, ...rest } = signed;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(canonicalize(rest))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
