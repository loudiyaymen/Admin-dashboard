import { Router } from "express";
import multer from "multer";
import * as eventsController from "../controllers/eventsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const eventsRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File type not allowed"), false);
  },
});

eventsRouter.post(
  "/",
  requireAdminAuth,
  upload.single("eventImage"),
  eventsController.createOne,
);
eventsRouter.get("/mine", eventsController.getMine);
eventsRouter.get("/", eventsController.getAll);
eventsRouter.post("/:id/register", eventsController.registerForEvent);
eventsRouter.delete("/:id/register", eventsController.cancelRegistration);
eventsRouter.get("/:id", eventsController.getOne);
eventsRouter.patch(
  "/:id",
  requireAdminAuth,
  upload.single("eventImage"),
  eventsController.updateOne,
);
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
