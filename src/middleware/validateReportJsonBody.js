export function validateReportJsonBody(req, res, next) {
  if (req.body === undefined || req.body === null) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  if (typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }
  next();
}
