import crypto from "crypto";
import { prisma } from "../prismaClient.js";
import { broadcast } from "../websocket.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

function buildResolutionMessage(alertType, originalMessage) {
  const title = String(alertType || "General alert").trim();
  const normalized = title.toLowerCase();

  if (normalized.includes("fire")) {
    return `Update: The fire-related issue has been resolved. Normal operations can resume. Reference: ${title}.`;
  }
  if (normalized.includes("evac")) {
    return `Update: The evacuation notice has been cleared. It is now safe to return to normal activity. Reference: ${title}.`;
  }
  if (normalized.includes("flood")) {
    return `Update: The flooding issue has been addressed and the area is now safe. Reference: ${title}.`;
  }
  if (normalized.includes("power")) {
    return `Update: The power outage issue has been resolved and service has been restored. Reference: ${title}.`;
  }
  if (normalized.includes("weather")) {
    return "Update: The weather alert is now resolved. Normal campus movement can resume.";
  }
  if (normalized.includes("security")) {
    return "Update: The security incident has been resolved. Continue to follow normal safety practices.";
  }
  if (normalized.includes("event")) {
    return "Update: The issue affecting the event has been resolved. Please proceed as planned.";
  }

  const sourceMessage = String(originalMessage || "").trim();
  return `Update: The reported issue has been resolved.${sourceMessage ? ` Original alert: ${sourceMessage}` : ""}`;
}

function isResolutionUpdateType(alertType) {
  const normalized = String(alertType || "")
    .trim()
    .toLowerCase();
  return normalized.endsWith("- resolved");
}

function buildAlertWsPayload(created, campus, building) {
  const message = String(created.message || "").trim();
  const createdAtIso = created?.created_at
    ? new Date(created.created_at).toISOString()
    : new Date().toISOString();

  return {
    event: "ALERT_CREATED",
    id: created.alert_id,
    title: created.alert_type ? `Alert: ${created.alert_type}` : "Campus alert",
    body: message,
    message,
    severity: created.severity ?? null,
    alertType: created.alert_type ?? null,
    isResolutionUpdate: isResolutionUpdateType(created.alert_type),
    campusId: created.campus_id ?? null,
    campusName: campus?.name ?? null,
    buildingId: created.building_id ?? null,
    buildingName: building?.name ?? null,
    buildingCode: building?.code ?? null,
    buildingAffected:
      building?.name ?? building?.code ?? created.building_id ?? null,
    startsAt: created.starts_at ?? null,
    endsAt: created.ends_at ?? null,
    sentAt: createdAtIso,
  };
}

export async function getAll(req, res) {
  try {
    const {
      alert_type,
      campus_id,
      building_id,
      severity,
      limit = 50,
      offset = 0,
    } = req.query;
    const data = await prisma.alert.findMany({
      where: {
        ...(alert_type ? { alert_type } : {}),
        ...(campus_id ? { campus_id } : {}),
        ...(building_id ? { building_id } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ starts_at: "desc" }, { created_at: "desc" }],
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    });
    res.json({ data });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function getOne(req, res) {
  try {
    const alert = await prisma.alert.findUnique({
      where: { alert_id: req.params.id },
    });
    if (!alert) {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    res.json(alert);
  } catch (e) {
    sendInternalError(res);
  }
}

export async function createOne(req, res) {
  try {
    const {
      alert_id,
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
      created_by_admin_id,
    } = req.body;
    if (!alert_id || !message) {
      return sendError(res, API_ERRORS.ALERT_REQUIRED_FIELDS);
    }
    await prisma.alert.create({
      data: {
        alert_id,
        alert_type: alert_type ?? null,
        message,
        severity: severity ?? null,
        campus_id: campus_id ?? null,
        building_id: building_id ?? null,
        starts_at: starts_at ? new Date(starts_at) : null,
        ends_at: ends_at ? new Date(ends_at) : null,
        created_by_admin_id: created_by_admin_id ?? null,
      },
    });
    res.status(201).json({
      alert_id,
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
    });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const {
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
    } = req.body;
    const data = {};
    if (alert_type !== undefined) data.alert_type = alert_type;
    if (message !== undefined) data.message = message;
    if (severity !== undefined) data.severity = severity;
    if (campus_id !== undefined) data.campus_id = campus_id;
    if (building_id !== undefined) data.building_id = building_id;
    if (starts_at !== undefined)
      data.starts_at = starts_at ? new Date(starts_at) : null;
    if (ends_at !== undefined)
      data.ends_at = ends_at ? new Date(ends_at) : null;

    if (Object.keys(data).length === 0) {
      return sendError(res, API_ERRORS.NO_FIELDS_TO_UPDATE);
    }
    const updated = await prisma.alert.update({
      where: { alert_id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}

export async function deleteOne(req, res) {
  try {
    await prisma.alert.delete({ where: { alert_id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}

export async function createGlobalAlert(req, res) {
  try {
    const {
      message,
      alert_type,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
      created_by_admin_id,
    } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return sendError(res, API_ERRORS.ALERT_MESSAGE_REQUIRED);
    }
    const alert_id = crypto.randomUUID();
    const created = await prisma.alert.create({
      data: {
        alert_id,
        alert_type: alert_type ?? null,
        message: message.trim(),
        severity: severity ?? null,
        campus_id: campus_id ?? null,
        building_id: building_id ?? null,
        starts_at: starts_at ? new Date(starts_at) : null,
        ends_at: ends_at ? new Date(ends_at) : null,
        is_resolved: false,
        resolved_at: null,
        created_by_admin_id: created_by_admin_id ?? null,
      },
    });

    let campus = null;
    let building = null;

    if (campus_id) {
      try {
        campus = await prisma.campus.findUnique({
          where: { id: campus_id },
          select: { id: true, name: true },
        });
      } catch (err) {
        console.error("Failed to fetch campus details:", err);
      }
    }

    if (building_id) {
      try {
        building = await prisma.building.findUnique({
          where: { building_id },
          select: { building_id: true, name: true, code: true },
        });
      } catch (err) {
        console.error("Failed to fetch building details:", err);
      }
    }

    const wsPayload = buildAlertWsPayload(created, campus, building);

    broadcast("ALERT_CREATED");
    broadcast(JSON.stringify(wsPayload));
    res.status(201).json({
      alert_id,
      alert_type: alert_type ?? null,
      message: message.trim(),
      severity: severity ?? null,
      campus_id: campus_id ?? null,
      building_id: building_id ?? null,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
    });
  } catch (e) {
    console.error("Error creating global alert:", e);
    sendInternalError(res);
  }
}

export async function resolveOne(req, res) {
  try {
    const alertId = String(req.params.id || "").trim();
    if (!alertId) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "alert id is required");
    }

    const existing = await prisma.alert.findUnique({
      where: { alert_id: alertId },
    });

    if (!existing) {
      return sendError(res, API_ERRORS.NOT_FOUND, "Alert not found");
    }

    if (existing.is_resolved) {
      return res.status(409).json({
        error: "Alert already resolved",
        alreadyResolved: true,
      });
    }

    if (isResolutionUpdateType(existing.alert_type)) {
      return res.status(409).json({
        error: "Resolution update alerts cannot be marked as fixed",
        notResolvable: true,
      });
    }

    const resolvedType = `${existing.alert_type || "General Alert"} - Resolved`;
    const resolvedMessage = buildResolutionMessage(
      existing.alert_type,
      existing.message,
    );

    const result = await prisma.$transaction(async (tx) => {
      const resolved = await tx.alert.update({
        where: { alert_id: alertId },
        data: {
          is_resolved: true,
          resolved_at: new Date(),
        },
      });

      const followUpAlertId = crypto.randomUUID();
      const followUp = await tx.alert.create({
        data: {
          alert_id: followUpAlertId,
          alert_type: resolvedType,
          message: resolvedMessage,
          severity: "info",
          campus_id: existing.campus_id ?? null,
          building_id: existing.building_id ?? null,
          starts_at: null,
          ends_at: null,
          is_resolved: false,
          resolved_at: null,
          created_by_admin_id: existing.created_by_admin_id ?? null,
        },
      });

      return { resolved, followUp };
    });

    let campus = null;
    let building = null;

    if (result.followUp.campus_id) {
      campus = await prisma.campus.findUnique({
        where: { id: result.followUp.campus_id },
        select: { id: true, name: true },
      });
    }

    if (result.followUp.building_id) {
      building = await prisma.building.findUnique({
        where: { building_id: result.followUp.building_id },
        select: { building_id: true, name: true, code: true },
      });
    }

    broadcast("ALERT_CREATED");
    broadcast(
      JSON.stringify(buildAlertWsPayload(result.followUp, campus, building)),
    );

    return res.status(201).json({
      resolvedAlertId: result.resolved.alert_id,
      resolvedAt: result.resolved.resolved_at,
      followUpAlertId: result.followUp.alert_id,
      followUpMessage: result.followUp.message,
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    sendInternalError(res);
  }
}
