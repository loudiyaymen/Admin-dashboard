import crypto from "crypto";
import { prisma } from "../prismaClient.js";
import { broadcast } from "../websocket.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

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
      starts_at,
      ends_at,
      created_by_admin_id,
    } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return sendError(res, API_ERRORS.ALERT_MESSAGE_REQUIRED);
    }
    const alert_id = crypto.randomUUID();
    await prisma.alert.create({
      data: {
        alert_id,
        alert_type: alert_type ?? null,
        message: message.trim(),
        severity: severity ?? null,
        campus_id: null,
        building_id: null,
        starts_at: starts_at ? new Date(starts_at) : null,
        ends_at: ends_at ? new Date(ends_at) : null,
        created_by_admin_id: created_by_admin_id ?? null,
      },
    });
    broadcast("ALERT_CREATED");
    broadcast("PUSH_ALERT");
    res.status(201).json({
      alert_id,
      alert_type: alert_type ?? null,
      message: message.trim(),
      severity: severity ?? null,
      campus_id: null,
      building_id: null,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
    });
  } catch (e) {
    sendInternalError(res);
  }
}
