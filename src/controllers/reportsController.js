import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";
import { processAndStoreFile } from "../services/fileUploadService.js";

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

function deriveReporterName(row) {
  if (Boolean(row.is_anonymous)) {
    return "Anonymous";
  }

  const email = String(row?.user?.email || "").trim();
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  if (row.user_id) {
    return row.user_id;
  }

  return null;
}

function toApiReport(row) {
  return {
    id: row.id,
    type: incidentTypeToApi[row.incident_type] ?? row.incident_type,
    description: row.description,
    floor_id: row.location_text ?? null,
    position: null,
    status: prismaToApiStatus[row.status] ?? row.status,
    created_at: row.created_at,
    campus_id: row.campus_id,
    user_id: row.user_id,
    reporter_name: deriveReporterName(row),
    reporter_email: Boolean(row.is_anonymous) ? "Anonymous" : row?.user?.email,
    location_text: row.location_text ?? null,
    incident_at: row.incident_at ?? null,
    is_anonymous: Boolean(row.is_anonymous),
    email_updates: Boolean(row.email_updates),
    photo_url: row.photo_url,
    attachments: [],
  };
}

function parseBooleanFlag(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

function parseOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function resolveUserIdForReport({ user_id, device_id }) {
  if (user_id) {
    return user_id;
  }

  const normalizedDeviceId = String(device_id || "").trim();
  if (!normalizedDeviceId) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { device_id: normalizedDeviceId },
    select: { id: true },
  });

  if (existing?.id) {
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      device_id: normalizedDeviceId,
      role: "student",
    },
    select: { id: true },
  });

  return created.id;
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
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
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
    const {
      type,
      description,
      campus_id,
      user_id,
      device_id,
      location_text,
      incident_at,
      is_anonymous,
      email_updates,
    } = req.body;
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

    const resolvedUserId = await resolveUserIdForReport({
      user_id,
      device_id,
    });

    // Process and store file to Azure Blob Storage or local disk
    let photoUrl = null;
    if (file) {
      try {
        photoUrl = await processAndStoreFile(file, "reports");
      } catch (uploadError) {
        console.error(
          "File upload failed, continuing without photo:",
          uploadError,
        );
        // Don't fail the whole request if photo upload fails
      }
    }

    const created = await prisma.report.create({
      data: {
        campus_id,
        user_id: resolvedUserId,
        incident_type,
        description: description.trim(),
        location_text: location_text ? String(location_text).trim() : null,
        incident_at: parseOptionalDate(incident_at),
        is_anonymous: parseBooleanFlag(is_anonymous, false),
        email_updates: parseBooleanFlag(email_updates, false),
        photo_url: photoUrl,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    res.status(201).json(toApiReport(created));
  } catch (error) {
    console.error("createOne error:", error);
    if (error.code === "P2003") {
      console.error("Invalid campus_id provided");
      return sendError(
        res,
        API_ERRORS.NOT_FOUND,
        "Selected campus does not exist. Please choose a valid campus.",
      );
    }
    sendInternalError(res);
  }
}

export async function getMine(req, res) {
  try {
    const device_id = String(req.query.device_id || "").trim();
    if (!device_id) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "device_id is required");
    }

    const user = await prisma.user.findUnique({
      where: { device_id },
      select: { id: true },
    });

    if (!user?.id) {
      return res.status(200).json({ data: [], total: 0 });
    }

    const rows = await prisma.report.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      data: rows.map(toApiReport),
      total: rows.length,
    });
  } catch (error) {
    console.error("getMine error:", error);
    sendInternalError(res);
  }
}

export async function getOne(req, res) {
  try {
    const id = req.params.id;
    if (!id || typeof id !== "string") {
      return sendError(res, API_ERRORS.REPORT_ID_INVALID);
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
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
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
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
