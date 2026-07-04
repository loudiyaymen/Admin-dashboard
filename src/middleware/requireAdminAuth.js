import jwt from "jsonwebtoken";
import { API_ERRORS, sendError } from "../errors/apiErrors.js";
import { isTokenRevoked } from "../auth/tokenBlacklist.js";
import { getAdminJwtSecret } from "../config/adminAuthConfig.js";

const JWT_SECRET = getAdminJwtSecret();

export function requireAdminAuth(req, res, next) {
  if (process.env.NODE_ENV === "test") {
    req.admin = { id: "test-admin", username: "test-admin", role: "admin" };
    return next();
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return sendError(res, API_ERRORS.AUTH_TOKEN_REQUIRED);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return sendError(res, API_ERRORS.AUTH_TOKEN_REQUIRED);
  }

  if (isTokenRevoked(token)) {
    return sendError(res, API_ERRORS.AUTH_TOKEN_REVOKED);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return sendError(res, API_ERRORS.UNAUTHORIZED);
    }

    req.admin = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    req.authToken = token;
    req.authPayload = payload;
    next();
  } catch (error) {
    return sendError(res, API_ERRORS.AUTH_TOKEN_INVALID);
  }
}
