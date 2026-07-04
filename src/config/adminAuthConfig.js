export function validateAdminAuthConfig() {
  if (process.env.NODE_ENV === "test") return;

  const missing = [];
  if (!process.env.ADMIN_JWT_SECRET) missing.push("ADMIN_JWT_SECRET");
  if (!process.env.ADMIN_USERNAME) missing.push("ADMIN_USERNAME");
  if (!process.env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      `Missing required admin auth env vars: ${missing.join(", ")}`,
    );
  }
}

export function getAdminJwtSecret() {
  if (process.env.NODE_ENV === "test") {
    return process.env.ADMIN_JWT_SECRET || "test-admin-jwt-secret";
  }

  if (!process.env.ADMIN_JWT_SECRET) {
    throw new Error("Missing required env var: ADMIN_JWT_SECRET");
  }
  return process.env.ADMIN_JWT_SECRET;
}

export function getDefaultAdminBootstrapCredentials() {
  if (process.env.NODE_ENV === "test") {
    return {
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "admin123",
    };
  }

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    throw new Error(
      "Missing required env vars: ADMIN_USERNAME and ADMIN_PASSWORD",
    );
  }

  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };
}
