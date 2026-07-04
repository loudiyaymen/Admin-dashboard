import { API_ERRORS, sendError } from "../errors/apiErrors.js";

export function validateReportJsonBody(req, res, next) {
  if (req.body === undefined || req.body === null) {
    return sendError(res, API_ERRORS.REQUEST_BODY_REQUIRED);
  }
  if (typeof req.body !== "object" || Array.isArray(req.body)) {
    return sendError(res, API_ERRORS.REQUEST_BODY_MUST_BE_OBJECT);
  }
  next();
}
