import crypto from 'crypto';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function toSeconds(duration = '1h') {
  if (typeof duration === 'number') return duration;
  const match = /^(\d+)([smhd])$/i.exec(duration);
  if (!match) return 3600; // default 1h
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 3600);
}

function getSecret() {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function signJwt(payload, { expiresIn = '1h' } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + toSeconds(expiresIn);
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');

  return `${unsigned}.${signature}`;
}
