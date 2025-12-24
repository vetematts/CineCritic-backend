import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}
