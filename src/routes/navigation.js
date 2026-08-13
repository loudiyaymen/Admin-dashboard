import { Router } from "express";
import * as navigationController from "../controllers/navigationController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const navigationRouter = Router();

navigationRouter.get("/graphs/version", navigationController.getGraphsVersion);
navigationRouter.get("/graphs", navigationController.getGraphs);
navigationRouter.get("/graphs/:identifier", navigationController.getGraph);
navigationRouter.get("/rooms", navigationController.getRooms);
navigationRouter.patch(
  "/rooms/:id",
  requireAdminAuth,
  navigationController.updateRoom,
);
