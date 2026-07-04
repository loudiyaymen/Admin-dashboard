import { Router } from "express";
import * as alertsController from "../controllers/alertsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const alertsRouter = Router();

alertsRouter.post(
  "/create",
  requireAdminAuth,
  alertsController.createGlobalAlert,
);
alertsRouter.post("/", requireAdminAuth, alertsController.createOne);
alertsRouter.get("/", alertsController.getAll);
alertsRouter.get("/:id", alertsController.getOne);
alertsRouter.patch("/:id", requireAdminAuth, alertsController.updateOne);
alertsRouter.delete("/:id", requireAdminAuth, alertsController.deleteOne);
