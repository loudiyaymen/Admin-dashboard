import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

function toApiCampus(row) {
  return {
    campus_id: row.id,
    name: row.name,
    created_at: row.created_at ?? null,
  };
}

export async function getAll(_req, res) {
  try {
    const result = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.json({ data: result.map(toApiCampus) });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function getOne(req, res) {
  try {
    const campus = await prisma.campus.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true },
    });
    if (!campus) {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    res.json(toApiCampus(campus));
  } catch (e) {
    sendInternalError(res);
  }
}

export async function createOne(req, res) {
  try {
    const { campus_id, name } = req.body;
    if (!campus_id || !name) {
      return sendError(res, API_ERRORS.CAMPUS_ID_AND_NAME_REQUIRED);
    }
    const created = await prisma.campus.create({
      data: { id: campus_id, name },
      select: { id: true, name: true },
    });
    res.status(201).json(toApiCampus(created));
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return sendError(res, API_ERRORS.CAMPUS_NAME_REQUIRED);
    }
    const updated = await prisma.campus.update({
      where: { id: req.params.id },
      data: { name },
      select: { id: true, name: true },
    });
    if (!updated) {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    res.json(toApiCampus(updated));
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}

export async function deleteOne(req, res) {
  try {
    await prisma.campus.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}
