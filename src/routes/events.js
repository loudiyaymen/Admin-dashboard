import { Router } from "express";
import multer from "multer";
import * as eventsController from "../controllers/eventsController.js";
import { API_ERRORS, sendError } from "../errors/apiErrors.js";
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

function uploadEventImage(req, res, next) {
  upload.single("eventImage")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      sendError(res, API_ERRORS.BAD_REQUEST, "Event image must be 5MB or smaller");
      return;
    }

    sendError(res, API_ERRORS.BAD_REQUEST, error.message || "Invalid event image");
  });
}

eventsRouter.post(
  "/",
  requireAdminAuth,
  uploadEventImage,
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
  uploadEventImage,
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
