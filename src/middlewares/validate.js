import { BadRequestError } from '../errors/http.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        params: req.params,
        query: req.query,
        body: req.body,
      });
      // Store validated data so handlers don't read raw input.
      req.validated = parsed;
      next();
    } catch (err) {
      const first = err?.errors?.[0];
      const message = first?.message || 'Invalid request';
      // Use custom error class so it goes through error handler middleware
      // which provides consistent error format (success, status, error, code, timestamp)
      return next(new BadRequestError(message, 'validation_error'));
    }
  };
}
