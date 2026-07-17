import { Router } from "express";
import * as usersController from "../controllers/usersController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const usersRouter = Router();

usersRouter.post("/activity", usersController.logDailyActiveUser);

usersRouter.get(
  "/activity/count",
  requireAdminAuth,
  usersController.getActiveUsersCount,
);
