export function asyncHandler(handler) {
  // Forward async errors to Express error handling.
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
