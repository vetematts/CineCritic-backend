import { NotFoundError } from '../errors/http.js';

export function notFound(req, res, next) {
  // Report unknown routes as a consistent 404.
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
