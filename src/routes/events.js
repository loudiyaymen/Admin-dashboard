import { Router } from "express";
import * as eventsController from "../controllers/eventsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const eventsRouter = Router();

eventsRouter.post("/", requireAdminAuth, eventsController.createOne);
eventsRouter.get("/mine", eventsController.getMine);
eventsRouter.get("/", eventsController.getAll);
eventsRouter.post("/:id/register", eventsController.registerForEvent);
eventsRouter.get("/:id", eventsController.getOne);
eventsRouter.patch("/:id", requireAdminAuth, eventsController.updateOne);
eventsRouter.delete("/:id", requireAdminAuth, eventsController.deleteOne);
eventsRouter.patch(
  "/:id/approve",
  requireAdminAuth,
  eventsController.approveEvent,
);
eventsRouter.delete(
  "/:id/reject",
  requireAdminAuth,
  eventsController.denyEvent,
);
eventsRouter.post(
  "/:id/drawWinner",
  requireAdminAuth,
  eventsController.drawWinner,
);
