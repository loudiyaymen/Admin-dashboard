import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/dashboard/metrics",
  requireAdminAuth,
  analyticsController.getDashboardMetrics,
);
analyticsRouter.get(
  "/resolution-rates",
  requireAdminAuth,
  analyticsController.getResolutionRates,
);
analyticsRouter.get(
  "/activity-overview",
  requireAdminAuth,
  analyticsController.getActivityOverview,
);
analyticsRouter.get(
  "/active-users-trend",
  requireAdminAuth,
  analyticsController.getActiveUsersTrend,
);
analyticsRouter.get(
  "/report-distribution",
  requireAdminAuth,
  analyticsController.getReportDistribution,
);
analyticsRouter.get(
  "/alert-metrics",
  requireAdminAuth,
  analyticsController.getAlertMetrics,
);
