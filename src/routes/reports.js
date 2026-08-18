import { Router } from "express";
import multer from "multer";
import * as reportsController from "../controllers/reportsController.js";
import { validateReportJsonBody } from "../middleware/validateReportJsonBody.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

// Use memory storage to avoid writing to disk before Azure upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File type not allowed"), false);
  },
});

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  upload.single("photo"),
  validateReportJsonBody,
  reportsController.createOne,
);
reportsRouter.get("/mine", reportsController.getMine);
reportsRouter.get("/", requireAdminAuth, reportsController.getAll);
reportsRouter.get("/:id", requireAdminAuth, reportsController.getOne);
reportsRouter.patch("/:id", requireAdminAuth, reportsController.updateOne);
reportsRouter.delete("/:id", requireAdminAuth, reportsController.deleteOne);
