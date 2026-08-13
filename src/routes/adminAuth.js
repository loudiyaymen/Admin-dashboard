import { Router } from "express";
import * as adminAuthController from "../controllers/adminAuthController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", adminAuthController.login);
adminAuthRouter.post("/logout", requireAdminAuth, adminAuthController.logout);
adminAuthRouter.get(
  "/credentials",
  requireAdminAuth,
  adminAuthController.getCredentials,
);
adminAuthRouter.patch(
  "/credentials",
  requireAdminAuth,
  adminAuthController.updateCredentials,
);
