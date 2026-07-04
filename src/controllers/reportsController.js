import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

const apiToIncidentType = {
  lost_item: "lostandfound",
  damaged_vehicle: "other",
  safety_concern: "suspicious",
  sexual_violence: "sexual",
};

const incidentTypeToApi = {
  lostandfound: "lost_item",
  other: "damaged_vehicle",
  suspicious: "safety_concern",
  sexual: "sexual_violence",
};

const apiToPrismaStatus = {
  new: "pending",
  in_review: "acknowledged",
  in_progress: "acknowledged",
  resolved: "resolved",
  dismissed: "dismissed",
};

const prismaToApiStatus = {
  pending: "new",
  acknowledged: "in_review",
  resolved: "resolved",
  dismissed: "dismissed",
};

function toApiReport(row) {
  return {
    id: row.id,
    type: incidentTypeToApi[row.incident_type] ?? row.incident_type,
    description: row.description,
    floor_id: null,
    position: null,
    status: prismaToApiStatus[row.status] ?? row.status,
    created_at: row.created_at,
    campus_id: row.campus_id,
    user_id: row.user_id,
    photo_url: row.photo_url,
    attachments: [],
  };
}

export async function getAll(req, res) {
  try {
    const {
      sort_by = "created_at",
      order = "DESC",
      page = 1,
      limit = 10,
      status,
      type,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const sortableMap = {
      id: "id",
      created_at: "created_at",
      status: "status",
      type: "incident_type",
    };
    const field = sortableMap[sort_by] ?? "created_at";
    const direction = String(order).toUpperCase() === "ASC" ? "asc" : "desc";

    const where = {};
    if (type) {
      const mappedType = apiToIncidentType[type];
      if (!mappedType) {
        return sendError(res, API_ERRORS.REPORT_INVALID_TYPE);
      }
      where.incident_type = mappedType;
    }
    if (status) {
      const mappedStatus = apiToPrismaStatus[status];
      if (!mappedStatus) {
        return sendError(res, API_ERRORS.REPORT_INVALID_STATUS);
      }
      where.status = mappedStatus;
    }

    const [rows, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { [field]: direction },
        take: limitNum,
        skip: offset,
      }),
      prisma.report.count({ where }),
    ]);

    res.status(200).json({
      data: rows.map(toApiReport),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("getAll error:", error);
    sendInternalError(res);
  }
}

export async function createOne(req, res) {
  try {
    const { type, description, campus_id, user_id } = req.body;
    const file = req.file;

    const incident_type = apiToIncidentType[type];
    if (!incident_type) {
      return sendError(res, API_ERRORS.REPORT_INVALID_TYPE);
    }

    if (!description || description.trim() === "") {
      return sendError(res, API_ERRORS.REPORT_DESCRIPTION_REQUIRED);
    }

    if (!campus_id) {
      return sendError(res, API_ERRORS.REPORT_CAMPUS_REQUIRED);
    }

    const created = await prisma.report.create({
      data: {
        campus_id,
        user_id: user_id || null,
        incident_type,
        description: description.trim(),
        photo_url: file ? file.path : null,
      },
    });

    res.status(201).json(toApiReport(created));
  } catch (error) {
    console.error("createOne error:", error);
    sendInternalError(res);
  }
}

export async function getOne(req, res) {
  try {
    const id = req.params.id;
    if (!id || typeof id !== "string") {
      return sendError(res, API_ERRORS.REPORT_ID_INVALID);
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return sendError(res, API_ERRORS.REPORT_NOT_FOUND);
    }

    res.status(200).json(toApiReport(report));
  } catch (error) {
    console.error("getOne error:", error);
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!id || typeof id !== "string") {
      return sendError(res, API_ERRORS.REPORT_ID_INVALID);
    }

    const mappedStatus = apiToPrismaStatus[status];
    if (!mappedStatus) {
      return sendError(res, API_ERRORS.REPORT_INVALID_STATUS);
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status: mappedStatus },
    });

    res.status(200).json(toApiReport(updated));
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, API_ERRORS.REPORT_NOT_FOUND);
    }
    console.error("updateOne error:", error);
    sendInternalError(res);
  }
}

export async function deleteOne(req, res) {
  try {
    const id = req.params.id;
    if (!id || typeof id !== "string") {
      return sendError(res, API_ERRORS.REPORT_ID_INVALID);
    }

    await prisma.report.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, API_ERRORS.REPORT_NOT_FOUND);
    }
    console.error("deleteOne error:", error);
    sendInternalError(res);
  }
}
