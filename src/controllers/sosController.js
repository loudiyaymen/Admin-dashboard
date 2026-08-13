import crypto from "crypto";
import { prisma } from "../prismaClient.js";
import { broadcast } from "../websocket.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

export async function trigger(req, res) {
  try {
    const { deviceInstallationId, estimatedFloor, campusId, userId } =
      req.body || {};
    const did = deviceInstallationId || req.headers["x-device-installation-id"];
    if (!did) {
      return sendError(res, API_ERRORS.DEVICE_INSTALLATION_ID_REQUIRED);
    }
    if (!campusId) {
      return sendError(res, API_ERRORS.SOS_CAMPUS_ID_REQUIRED);
    }
    const sosEventId = crypto.randomUUID();
    const createdSosEvent = await prisma.sosEvent.create({
      data: {
        sos_event_id: sosEventId,
        device_installation_id: did,
        status: "active",
        estimated_floor_id:
          estimatedFloor && typeof estimatedFloor === "string"
            ? estimatedFloor
            : null,
      },
    });
    await prisma.sosLog.create({
      data: {
        campus_id: campusId,
        user_id: userId ?? null,
        device_id: did,
      },
    });
    const campus = prisma.campus?.findUnique
      ? await prisma.campus.findUnique({
          where: { id: campusId },
          select: { id: true, name: true },
        })
      : null;

    const createdAtIso = createdSosEvent?.created_at
      ? new Date(createdSosEvent.created_at).toISOString()
      : new Date().toISOString();

    const wsPayload = {
      event: "SOS_ACTIVE",
      id: sosEventId,
      title: "SOS active",
      body: "An SOS emergency has been triggered.",
      sosEventId,
      status: "active",
      campusId,
      campusName: campus?.name ?? null,
      deviceInstallationId: did,
      estimatedFloorId: createdSosEvent.estimated_floor_id ?? null,
      sentAt: createdAtIso,
    };

    broadcast("SOS_ACTIVE");
    broadcast(JSON.stringify(wsPayload));
    res.status(201).json({ sosEventId, status: "active" });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function end(req, res) {
  try {
    const updated = await prisma.sosEvent.update({
      where: { sos_event_id: req.params.sosId },
      data: { status: "ended", ended_at: new Date() },
      select: { sos_event_id: true, status: true, ended_at: true },
    });
    res.json(updated);
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}

export async function getAll(req, res) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const data = await prisma.sosEvent.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: "desc" },
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
    const row = await prisma.sosEvent.findUnique({
      where: { sos_event_id: req.params.id },
    });
    if (!row) {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    res.json(row);
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const { status, ended_at } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (ended_at !== undefined) data.ended_at = ended_at;

    if (Object.keys(data).length === 0) {
      return sendError(res, API_ERRORS.NO_FIELDS_TO_UPDATE);
    }
    const updated = await prisma.sosEvent.update({
      where: { sos_event_id: req.params.id },
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
