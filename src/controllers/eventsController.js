import prisma from "../database.js";

function isAdmin(req) {
  return req.headers["x-admin"] === "true";
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
    res.status(500).json({ error: e.message });
  }
}

export async function getOne(req, res) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { campus: true, location_node: true },
    });

    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createOne(req, res) {
  try {
    const admin = isAdmin(req);
    const { title, event_date, campus_id, location_node_id, host_type } =
      req.body;

    const newEvent = await prisma.event.create({
      data: {
        title,
        event_date: new Date(event_date),
        campus_id,
        location_node_id,
        host_type: host_type,
        is_approved: admin,
      },
    });

    res.status(201).json(newEvent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        event_date: req.body.event_date
          ? new Date(req.body.event_date)
          : undefined,
        location_node_id: req.body.location_node_id,
        is_approved: req.body.is_approved,
      },
    });
    res.json(updatedEvent);
  } catch (e) {
    res.status(404).json({ error: "Event not found or invalid data" });
  }
}

export async function deleteOne(req, res) {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: "Event not found" });
  }
}

export async function approveEvent(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { is_approved: true },
    });
    res.json(event);
  } catch (e) {
    res.status(404).json({ error: "Event not found" });
  }
}

export async function denyEvent(req, res) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

    await prisma.event.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Event rejected" });
  } catch (e) {
    res.status(404).json({ error: "Event not found" });
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
    res.status(500).json({ error: "Failed to draw winner" });
  }
};
