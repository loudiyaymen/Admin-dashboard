import { Router } from "express";
import * as floorsController from "../controllers/floorsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const floorsRouter = Router();

floorsRouter.post("/", requireAdminAuth, floorsController.createOne);
floorsRouter.get("/", floorsController.getAll);
floorsRouter.get("/:id", floorsController.getOne);
floorsRouter.patch("/:id", requireAdminAuth, floorsController.updateOne);
floorsRouter.delete("/:id", requireAdminAuth, floorsController.deleteOne);
