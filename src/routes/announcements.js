import { Router } from "express";
import * as announcementsController from "../controllers/announcementsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const announcementsRouter = Router();

announcementsRouter.post(
  "/",
  requireAdminAuth,
  announcementsController.createOne,
);
announcementsRouter.get("/", announcementsController.getAll);
announcementsRouter.get("/:id", announcementsController.getOne);
announcementsRouter.patch(
  "/:id",
  requireAdminAuth,
  announcementsController.updateOne,
);
announcementsRouter.delete(
  "/:id",
  requireAdminAuth,
  announcementsController.deleteOne,
);
