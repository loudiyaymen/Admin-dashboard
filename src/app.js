import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./middleware/logger.js";
import { sanitizeInput } from "./middleware/sanitizeInput.js";
import { initializeAzureBlobStorage } from "./services/azureBlobService.js";
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

// Initialize Azure Blob Storage if credentials are available
initializeAzureBlobStorage();

export const app = express();

// Ensure local uploads directory exists as fallback
const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

const explicitOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://proud-cliff-09f5ba80f.1.azurestaticapps.net",
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .map(normalizeOrigin);

const envOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const corsAllowlist = new Set([...explicitOrigins, ...envOrigins]);

function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (corsAllowlist.has(normalized)) return true;

  // Allow Azure Static Web Apps production and preview domains.
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)?\.azurestaticapps\.net$/i.test(normalized)) {
    return true;
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(sanitizeInput);
app.use(logger);

// Serve local uploads as fallback (when Azure Blob Storage is not available)
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
