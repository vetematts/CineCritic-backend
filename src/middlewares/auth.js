import { verifyJwt } from '../auth/jwt.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  return next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}
