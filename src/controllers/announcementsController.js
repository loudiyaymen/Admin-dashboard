import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

export async function getAll(req, res) {
  try {
    const {
      campus_id,
      building_id,
      severity,
      limit = 50,
      offset = 0,
    } = req.query;
    const data = await prisma.announcement.findMany({
      where: {
        ...(campus_id ? { campus_id } : {}),
        ...(building_id ? { building_id } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
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
    const row = await prisma.announcement.findUnique({
      where: { announcement_id: req.params.id },
    });
    if (!row) {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    res.json(row);
  } catch (e) {
    sendInternalError(res);
  }
}

export async function createOne(req, res) {
  try {
    const {
      announcement_id,
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
      created_by_admin_id,
    } = req.body;
    if (!announcement_id || !title) {
      return sendError(res, API_ERRORS.ANNOUNCEMENT_REQUIRED_FIELDS);
    }
    await prisma.announcement.create({
      data: {
        announcement_id,
        title,
        body: body ?? null,
        severity: severity ?? null,
        campus_id: campus_id ?? null,
        building_id: building_id ?? null,
        published_at: published_at ? new Date(published_at) : null,
        expires_at: expires_at ? new Date(expires_at) : null,
        created_by_admin_id: created_by_admin_id ?? null,
      },
    });
    res.status(201).json({
      announcement_id,
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
    });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const {
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
    } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (body !== undefined) data.body = body;
    if (severity !== undefined) data.severity = severity;
    if (campus_id !== undefined) data.campus_id = campus_id;
    if (building_id !== undefined) data.building_id = building_id;
    if (published_at !== undefined)
      data.published_at = published_at ? new Date(published_at) : null;
    if (expires_at !== undefined)
      data.expires_at = expires_at ? new Date(expires_at) : null;

    if (Object.keys(data).length === 0) {
      return sendError(res, API_ERRORS.NO_FIELDS_TO_UPDATE);
    }
    const updated = await prisma.announcement.update({
      where: { announcement_id: req.params.id },
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
    await prisma.announcement.delete({
      where: { announcement_id: req.params.id },
    });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}
