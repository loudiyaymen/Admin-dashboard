import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./middleware/logger.js";
import { sanitizeInput } from "./middleware/sanitizeInput.js";
import { campusesRouter } from "./routes/campuses.js";
import { buildingsRouter } from "./routes/buildings.js";
import { floorsRouter } from "./routes/floors.js";
import { navigationRouter } from "./routes/navigation.js";
import { announcementsRouter } from "./routes/announcements.js";
import { alertsRouter } from "./routes/alerts.js";
import { eventsRouter } from "./routes/events.js";
import { sosRouter } from "./routes/sos.js";
import { reportsRouter } from "./routes/reports.js";
import { adminAuthRouter } from "./routes/adminAuth.js";
import { analyticsRouter } from "./routes/analytics.js";
import { usersRouter } from "./routes/users.js";
import { API_ERRORS, sendError } from "./errors/apiErrors.js";
import { validateAdminAuthConfig } from "./config/adminAuthConfig.js";

validateAdminAuthConfig();

export const app = express();

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: "*" }));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json());
app.use(sanitizeInput);
app.use(logger);
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const v1 = express.Router();

v1.use("/campuses", campusesRouter);
v1.use("/buildings", buildingsRouter);
v1.use("/floors", floorsRouter);
v1.use("/navigation", navigationRouter);

v1.use("/announcements", announcementsRouter);
v1.use("/alerts", alertsRouter);
v1.use("/events", eventsRouter);

v1.use("/sos", sosRouter);

v1.use("/reports", reportsRouter);
v1.use("/admin", adminAuthRouter);
v1.use("/analytics", analyticsRouter);
v1.use("/users", usersRouter);

app.use("/api/v1", v1);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, API_ERRORS.INVALID_JSON);
  }
  next(err);
});
