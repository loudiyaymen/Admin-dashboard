import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

const VALID_HOST_TYPES = new Set(["admin", "student"]);

function parseOptionalDate(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function parseOptionalInt(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }
  const parsed = parseInt(String(rawValue), 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function isAdmin(req) {
  return req.admin?.role === "admin";
}

export async function getAll(req, res) {
  try {
    const admin = isAdmin(req);
    const { campus_id, location_node_id, limit = 50, offset = 0 } = req.query;

    const events = await prisma.event.findMany({
      where: {
        campus_id: campus_id || undefined,
        location_node_id: location_node_id || undefined,
        ...(admin ? {} : { is_approved: true }),
      },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      orderBy: { event_date: "desc" },
      include: {
        campus: true,
        location_node: true,
      },
    });

    res.json({ data: events });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function getOne(req, res) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { campus: true, location_node: true },
    });

    if (!event) return sendError(res, API_ERRORS.EVENT_NOT_FOUND);
    res.json(event);
  } catch (e) {
    sendInternalError(res);
  }
}

export async function getMine(req, res) {
  try {
    const deviceId = String(req.query.device_id || "").trim();
    if (!deviceId) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "device_id is required");
    }

    const registrations = await prisma.eventParticipant.findMany({
      where: { device_id: deviceId },
      include: {
        event: {
          include: {
            campus: true,
            location_node: true,
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });

    const events = registrations
      .map((row) => row.event)
      .filter((event) => Boolean(event));

    res.json({ data: events });
  } catch (e) {
    sendInternalError(res);
  }
}

export async function createOne(req, res) {
  try {
    const admin = isAdmin(req);
    const {
      title,
      event_date,
      campus_id,
      location_node_id,
      host_type,
      event_type,
      description,
      location_text,
      registration_start_at,
      registration_end_at,
      max_participants,
      is_unlimited,
      event_url,
      fee_cents,
      event_image_url,
    } = req.body;

    const normalizedEventType = event_type ?? req.body.type ?? null;
    const normalizedDescription = description ?? req.body.details ?? null;
    const normalizedLocationText = location_text ?? req.body.location ?? null;

    if (!title || !event_date || !campus_id) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "title, event_date and campus_id are required",
      );
    }

    const parsedDate = new Date(event_date);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "event_date must be a valid ISO date string",
      );
    }

    const normalizedHostType = host_type ?? "admin";
    if (!VALID_HOST_TYPES.has(normalizedHostType)) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "host_type must be one of: admin, student",
      );
    }

    const parsedRegistrationStartAt = parseOptionalDate(registration_start_at);
    const parsedRegistrationEndAt = parseOptionalDate(registration_end_at);
    const parsedMaxParticipants = parseOptionalInt(max_participants);
    const parsedFeeCents = parseOptionalInt(fee_cents);

    if (
      parsedRegistrationStartAt === null ||
      parsedRegistrationEndAt === null
    ) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "registration_start_at and registration_end_at must be valid ISO date strings",
      );
    }

    if (parsedMaxParticipants === null || parsedFeeCents === null) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "max_participants and fee_cents must be valid integers",
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        event_date: parsedDate,
        campus_id,
        location_node_id,
        host_type: normalizedHostType,
        event_type: normalizedEventType,
        description: normalizedDescription,
        location_text: normalizedLocationText,
        registration_start_at: parsedRegistrationStartAt,
        registration_end_at: parsedRegistrationEndAt,
        max_participants: parsedMaxParticipants,
        is_unlimited: Boolean(is_unlimited),
        event_url: event_url ?? null,
        fee_cents: parsedFeeCents,
        event_image_url: event_image_url ?? null,
        is_approved: admin,
      },
    });

    res.status(201).json(newEvent);
  } catch (e) {
    if (e?.code === "P2003") {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "Invalid campus_id or location_node_id",
      );
    }
    sendInternalError(res);
  }
}

export async function updateOne(req, res) {
  try {
    const parsedRegistrationStartAt = parseOptionalDate(
      req.body.registration_start_at,
    );
    const parsedRegistrationEndAt = parseOptionalDate(
      req.body.registration_end_at,
    );
    const parsedMaxParticipants = parseOptionalInt(req.body.max_participants);
    const parsedFeeCents = parseOptionalInt(req.body.fee_cents);

    if (
      parsedRegistrationStartAt === null ||
      parsedRegistrationEndAt === null
    ) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "registration_start_at and registration_end_at must be valid ISO date strings",
      );
    }

    if (parsedMaxParticipants === null || parsedFeeCents === null) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "max_participants and fee_cents must be valid integers",
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        event_date: req.body.event_date
          ? new Date(req.body.event_date)
          : undefined,
        location_node_id: req.body.location_node_id,
        event_type: req.body.event_type ?? req.body.type,
        description: req.body.description ?? req.body.details,
        location_text: req.body.location_text ?? req.body.location,
        registration_start_at: parsedRegistrationStartAt,
        registration_end_at: parsedRegistrationEndAt,
        max_participants: parsedMaxParticipants,
        is_unlimited:
          req.body.is_unlimited === undefined
            ? undefined
            : Boolean(req.body.is_unlimited),
        event_url: req.body.event_url,
        fee_cents: parsedFeeCents,
        event_image_url: req.body.event_image_url,
        is_approved: req.body.is_approved,
      },
    });
    res.json(updatedEvent);
  } catch (e) {
    sendError(res, API_ERRORS.EVENT_NOT_FOUND_OR_INVALID);
  }
}

export async function deleteOne(req, res) {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    sendError(res, API_ERRORS.EVENT_NOT_FOUND);
  }
}

export async function registerForEvent(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    const deviceId = String(req.body?.device_id || "").trim();

    if (!eventId) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "event id is required");
    }

    if (!deviceId) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "device_id is required");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        is_approved: true,
      },
    });

    if (!event) {
      return sendError(res, API_ERRORS.EVENT_NOT_FOUND);
    }

    if (!event.is_approved) {
      return sendError(
        res,
        API_ERRORS.BAD_REQUEST,
        "Cannot register for an unapproved event",
      );
    }

    const alreadyRegistered = await prisma.eventParticipant.findUnique({
      where: {
        event_id_device_id: {
          event_id: eventId,
          device_id: deviceId,
        },
      },
      select: { event_id: true, device_id: true },
    });

    if (alreadyRegistered) {
      return res.status(409).json({
        error: "Already registered for this event",
        alreadyRegistered: true,
      });
    }

    const registration = await prisma.eventParticipant.create({
      data: {
        event_id: eventId,
        device_id: deviceId,
      },
    });

    return res.status(201).json({
      event_id: registration.event_id,
      device_id: registration.device_id,
      joined_at: registration.joined_at,
    });
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({
        error: "Already registered for this event",
        alreadyRegistered: true,
      });
    }
    sendInternalError(res);
  }
}

export async function approveEvent(req, res) {
  try {
    if (!isAdmin(req)) return sendError(res, API_ERRORS.ADMIN_ONLY);

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { is_approved: true },
    });
    res.json(event);
  } catch (e) {
    sendError(res, API_ERRORS.EVENT_NOT_FOUND);
  }
}

export async function denyEvent(req, res) {
  try {
    if (!isAdmin(req)) return sendError(res, API_ERRORS.ADMIN_ONLY);

    await prisma.event.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Event rejected" });
  } catch (e) {
    sendError(res, API_ERRORS.EVENT_NOT_FOUND);
  }
}

export const drawWinner = async (req, res) => {
  const { id } = req.params;

  try {
    const participants = await prisma.eventParticipant.findMany({
      where: { event_id: id },
    });

    if (participants.length === 0) {
      return res.status(404).json({ message: "No participants found" });
    }

    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    res.json({
      message: "Winner selected",
      winner: winner.device_id,
    });
  } catch (error) {
    sendError(res, API_ERRORS.DRAW_WINNER_FAILED);
  }
};
