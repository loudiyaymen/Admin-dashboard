import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

export async function getAll(req, res) {
  try {
    const { campus_id, campusId, limit = 100, offset = 0 } = req.query;
    const campus = campus_id || campusId;
    const data = await prisma.building.findMany({
      where: {
        ...(campus ? { campus_id: campus } : {}),
      },
      orderBy: { name: "asc" },
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
    const row = await prisma.building.findUnique({
      where: { building_id: req.params.id },
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
    const { building_id, campus_id, code, name } = req.body;
    if (!building_id || !campus_id || !name) {
      return sendError(res, API_ERRORS.BUILDING_REQUIRED_FIELDS);
    }
    await prisma.building.create({
      data: {
        building_id,
        campus_id,
        code: code ?? null,
        name,
      },
    });
    res.status(201).json({ building_id, campus_id, code, name });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const { campus_id, code, name } = req.body;
    const data = {};
    if (campus_id !== undefined) data.campus_id = campus_id;
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;

    if (Object.keys(data).length === 0) {
      return sendError(res, API_ERRORS.NO_FIELDS_TO_UPDATE);
    }
    const updated = await prisma.building.update({
      where: { building_id: req.params.id },
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
    await prisma.building.delete({ where: { building_id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}
