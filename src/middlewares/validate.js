export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        params: req.params,
        query: req.query,
        body: req.body,
      });
      req.validated = parsed;
      next();
    } catch (err) {
      const first = err?.errors?.[0];
      return res.status(400).json({ error: first?.message || 'Invalid request' });
    }
  };
}
