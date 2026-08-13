import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";
import { revokeToken } from "../auth/tokenBlacklist.js";
import {
  getAdminJwtSecret,
  getDefaultAdminBootstrapCredentials,
} from "../config/adminAuthConfig.js";

const JWT_SECRET = getAdminJwtSecret();
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "8h";

async function ensureDefaultAdminCredential() {
  const existing = await prisma.adminCredential.findFirst();
  if (existing) return existing;

  const { username, password } = getDefaultAdminBootstrapCredentials();
  const password_hash = await bcrypt.hash(password, 10);
  return prisma.adminCredential.create({
    data: {
      username,
      password_hash,
    },
  });
}

function createToken(adminCredential) {
  return jwt.sign(
    {
      sub: String(adminCredential.id),
      username: adminCredential.username,
      role: "admin",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username) return sendError(res, API_ERRORS.USERNAME_REQUIRED);
    if (!password) return sendError(res, API_ERRORS.PASSWORD_REQUIRED);

    await ensureDefaultAdminCredential();

    const adminCredential = await prisma.adminCredential.findUnique({
      where: { username },
    });

    if (!adminCredential) {
      return sendError(res, API_ERRORS.INVALID_CREDENTIALS);
    }

    const isValid = await bcrypt.compare(
      password,
      adminCredential.password_hash,
    );
    if (!isValid) {
      return sendError(res, API_ERRORS.INVALID_CREDENTIALS);
    }

    const token = createToken(adminCredential);
    return res.status(200).json({
      token,
      username: adminCredential.username,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    return sendInternalError(res);
  }
}

export async function getCredentials(_req, res) {
  try {
    const adminCredential = await ensureDefaultAdminCredential();
    return res.status(200).json({ username: adminCredential.username });
  } catch (error) {
    return sendInternalError(res);
  }
}

export async function updateCredentials(req, res) {
  try {
    const { currentPassword, username, password } = req.body || {};

    if (!currentPassword) {
      return sendError(res, API_ERRORS.CURRENT_PASSWORD_REQUIRED);
    }

    if (!username && !password) {
      return sendError(res, API_ERRORS.USERNAME_OR_PASSWORD_UPDATE_REQUIRED);
    }

    const adminCredential = await ensureDefaultAdminCredential();

    const isValid = await bcrypt.compare(
      currentPassword,
      adminCredential.password_hash,
    );
    if (!isValid) {
      return sendError(res, API_ERRORS.INVALID_CREDENTIALS);
    }

    const data = {};
    if (username) data.username = username;
    if (password) data.password_hash = await bcrypt.hash(password, 10);

    const updated = await prisma.adminCredential.update({
      where: { id: adminCredential.id },
      data,
      select: { id: true, username: true },
    });

    return res.status(200).json({
      id: updated.id,
      username: updated.username,
      message: "Admin credentials updated",
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return sendError(res, API_ERRORS.BAD_REQUEST, "username already exists");
    }
    return sendInternalError(res);
  }
}

export async function logout(req, res) {
  try {
    const token = req.authToken;
    const exp = req.authPayload?.exp;

    if (!token) {
      return sendError(res, API_ERRORS.AUTH_TOKEN_REQUIRED);
    }

    revokeToken(token, exp);
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return sendInternalError(res);
  }
}
