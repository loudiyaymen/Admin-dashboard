import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

export async function getAll(req, res) {
  try {
    const { building_id, buildingId, limit = 100, offset = 0 } = req.query;
    const building = building_id || buildingId;
    const data = await prisma.floor.findMany({
      where: {
        ...(building ? { building_id: building } : {}),
      },
      orderBy: [{ building_id: "asc" }, { floor_number: "asc" }],
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
    const row = await prisma.floor.findUnique({
      where: { floor_id: req.params.id },
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
      floor_id,
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    } = req.body;
    if (!floor_id || !building_id) {
      return sendError(res, API_ERRORS.FLOOR_REQUIRED_FIELDS);
    }
    await prisma.floor.create({
      data: {
        floor_id,
        building_id,
        floor_number: floor_number ?? null,
        floor_label: floor_label ?? null,
        elevation_meters: elevation_meters ?? null,
        map_asset_key: map_asset_key ?? null,
      },
    });
    res.status(201).json({
      floor_id,
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const {
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    } = req.body;
    const data = {};
    if (building_id !== undefined) data.building_id = building_id;
    if (floor_number !== undefined) data.floor_number = floor_number;
    if (floor_label !== undefined) data.floor_label = floor_label;
    if (elevation_meters !== undefined)
      data.elevation_meters = elevation_meters;
    if (map_asset_key !== undefined) data.map_asset_key = map_asset_key;

    if (Object.keys(data).length === 0) {
      return sendError(res, API_ERRORS.NO_FIELDS_TO_UPDATE);
    }
    const updated = await prisma.floor.update({
      where: { floor_id: req.params.id },
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
    await prisma.floor.delete({ where: { floor_id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") {
      return sendError(res, API_ERRORS.NOT_FOUND);
    }
    sendInternalError(res);
  }
}
