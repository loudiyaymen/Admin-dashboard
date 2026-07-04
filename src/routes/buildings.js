import { Router } from "express";
import * as buildingsController from "../controllers/buildingsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const buildingsRouter = Router();

buildingsRouter.post("/", requireAdminAuth, buildingsController.createOne);
buildingsRouter.get("/", buildingsController.getAll);
buildingsRouter.get("/:id", buildingsController.getOne);
buildingsRouter.patch("/:id", requireAdminAuth, buildingsController.updateOne);
buildingsRouter.delete("/:id", requireAdminAuth, buildingsController.deleteOne);
