import { Router } from "express";
import * as campusesController from "../controllers/campusesController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const campusesRouter = Router();

campusesRouter.post("/", requireAdminAuth, campusesController.createOne);
campusesRouter.get("/", campusesController.getAll);
campusesRouter.get("/:id", campusesController.getOne);
campusesRouter.patch("/:id", requireAdminAuth, campusesController.updateOne);
campusesRouter.delete("/:id", requireAdminAuth, campusesController.deleteOne);
