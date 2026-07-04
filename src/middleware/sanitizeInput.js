import xss from "xss";

function sanitizeValue(value) {
  if (typeof value === "string") {
    return xss(value, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script"],
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized = {};
    for (const [key, innerValue] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(innerValue);
    }
    return sanitized;
  }

  return value;
}

export function sanitizeInput(req, _res, next) {
  req.body = sanitizeValue(req.body);

  const sanitizedQuery = sanitizeValue(req.query);
  if (sanitizedQuery && typeof sanitizedQuery === "object") {
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }

  const sanitizedParams = sanitizeValue(req.params);
  if (sanitizedParams && typeof sanitizedParams === "object") {
    Object.keys(req.params).forEach((key) => delete req.params[key]);
    Object.assign(req.params, sanitizedParams);
  }

  next();
}
