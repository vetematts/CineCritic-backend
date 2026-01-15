import { verifyJwt } from './jwt.js';
import { ForbiddenError, UnauthorisedError } from '../errors/http.js';

export function requireAuth(req, res, next) {
  // Expect an Authorisation: Bearer <token> header.
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorisedError());
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return next(new UnauthorisedError('Invalid or expired token'));
  }

  req.user = payload;
  return next();
}

export function requireRole(role) {
  return (req, res, next) => {
    // Role guard for admin-only routes.
    if (!req.user) {
      return next(new UnauthorisedError());
    }
    if (req.user.role !== role) {
      return next(new ForbiddenError());
    }
    return next();
  };
}
