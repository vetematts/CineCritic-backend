import { HttpError } from '../errors/http.js';

// General error handler for the app
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    // Keep logs out of test output
    console.error(err);
  }
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'internal_error' : 'error');
  const message = err instanceof HttpError ? err.message : err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    code,
  });
}
