import { HttpError } from '../errors/http.js';
import { logger } from '../utils/errorLogger.js';

// Final error handler that keeps API responses consistent.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logger.error(err);
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'internal_error' : 'error');
  const message = err instanceof HttpError ? err.message : err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    code,
  });
}
