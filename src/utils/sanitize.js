export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const clean = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      clean[key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  return clean;
}
