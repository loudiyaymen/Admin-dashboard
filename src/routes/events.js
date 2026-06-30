import { Router } from "express";
import * as eventsController from "../controllers/eventsController.js";

export const eventsRouter = Router();

eventsRouter.post("/", eventsController.createOne);
eventsRouter.get("/", eventsController.getAll);
eventsRouter.get("/:id", eventsController.getOne);
eventsRouter.patch("/:id", eventsController.updateOne);
eventsRouter.delete("/:id", eventsController.deleteOne);
eventsRouter.patch("/:id/approve", eventsController.approveEvent);
eventsRouter.delete("/:id/reject", eventsController.denyEvent);
