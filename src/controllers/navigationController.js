import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseRoomLabel(rawLabel) {
  const normalized = String(rawLabel || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const roomPattern = normalized.match(
    /(?:room|romm)?\s*([a-z])\s*([0-9]{2,}[a-z0-9-]*)\s*(.*)$/i,
  );

  if (!roomPattern) {
    return {
      roomNumber: "-",
      roomName: normalized ? titleCase(normalized) : "-",
    };
  }

  const roomNumber = `${roomPattern[1].toUpperCase()}${roomPattern[2].toUpperCase()}`;
  const suffix = String(roomPattern[3] || "").trim();

  return {
    roomNumber,
    roomName: suffix ? titleCase(suffix) : "-",
  };
}

function deriveFloorFromRoomNumber(roomNumber) {
  const normalized = String(roomNumber || "").trim();
  const floorDigit = normalized.match(/^[A-Z](\d)/i);
  if (!floorDigit) return null;
  const parsed = Number.parseInt(floorDigit[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildRoomLabel(roomNumber, roomName) {
  const normalizedNumber = String(roomNumber || "")
    .trim()
    .toUpperCase();
  const normalizedName = String(roomName || "").trim();

  if (!normalizedNumber) {
    return normalizedName || "Unnamed Room";
  }

  return normalizedName
    ? `Room${normalizedNumber} ${normalizedName}`
    : `Room${normalizedNumber}`;
}

function normalizeGraphRow(row) {
  return {
    buildingId: row.building_id,
    buildingName: row.building?.name || row.building_id,
    buildingCode: row.building?.code || null,
    graphData: row.graph_data || {},
    sourceFile: row.source_file || null,
    updatedAt: row.updated_at,
  };
}

function flattenRooms(row) {
  const graphData = row.graph_data || {};

  return Object.values(graphData)
    .filter((node) => String(node?.type || "").toLowerCase() === "room_door")
    .map((node) => {
      const { roomNumber, roomName } = parseRoomLabel(node?.label);
      return {
        id: `${row.building_id}:${node.id}`,
        buildingId: row.building_id,
        buildingName: row.building?.name || row.building_id,
        buildingCode: row.building?.code || null,
        roomNumber,
        roomName,
        floor:
          typeof node?.level === "number"
            ? node.level
            : deriveFloorFromRoomNumber(roomNumber),
        sourceFile: row.source_file || null,
        nodeId: node.id,
        nodeType: node.type || null,
        label: node.label || null,
        level: typeof node?.level === "number" ? node.level : null,
        updatedAt: row.updated_at,
      };
    });
}

function mapRoomFromNode(row, node) {
  const { roomNumber, roomName } = parseRoomLabel(node?.label);
  return {
    id: `${row.building_id}:${node.id}`,
    buildingId: row.building_id,
    buildingName: row.building?.name || row.building_id,
    buildingCode: row.building?.code || null,
    roomNumber,
    roomName,
    floor:
      typeof node?.level === "number"
        ? node.level
        : deriveFloorFromRoomNumber(roomNumber),
    sourceFile: row.source_file || null,
    nodeId: node.id,
    nodeType: node.type || null,
    label: node.label || null,
    level: typeof node?.level === "number" ? node.level : null,
    updatedAt: row.updated_at,
  };
}

async function loadGraphs() {
  return prisma.navigationGraph.findMany({
    include: {
      building: true,
    },
    orderBy: {
      building: {
        name: "asc",
      },
    },
  });
}

export async function getGraphs(req, res) {
  try {
    const rows = await loadGraphs();
    res.json({ data: rows.map(normalizeGraphRow) });
  } catch (error) {
    sendInternalError(res);
  }
}

export async function getGraph(req, res) {
  try {
    const identifier = String(req.params.identifier || "").trim();
    if (!identifier) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "identifier is required");
    }

    const row = await prisma.navigationGraph.findFirst({
      where: {
        OR: [{ building_id: identifier }, { building: { code: identifier } }],
      },
      include: {
        building: true,
      },
    });

    if (!row) {
      return sendError(res, API_ERRORS.NOT_FOUND, "Navigation graph not found");
    }

    res.json(normalizeGraphRow(row));
  } catch (error) {
    sendInternalError(res);
  }
}

export async function getRooms(req, res) {
  try {
    const {
      building_id,
      buildingId,
      buildingCode,
      search = "",
      limit,
      offset,
    } = req.query;
    const buildingFilter = String(building_id || buildingId || "").trim();
    const codeFilter = String(buildingCode || "").trim();
    const query = String(search || "")
      .trim()
      .toLowerCase();

    const rows = await loadGraphs();
    const rooms = rows.flatMap(flattenRooms).filter((room) => {
      if (buildingFilter && room.buildingId !== buildingFilter) {
        return false;
      }
      if (
        codeFilter &&
        String(room.buildingCode || "").toLowerCase() !==
          codeFilter.toLowerCase()
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [room.roomNumber, room.roomName, room.buildingName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    rooms.sort((first, second) => {
      const buildingCompare = first.buildingName.localeCompare(
        second.buildingName,
      );
      if (buildingCompare !== 0) return buildingCompare;
      const floorCompare = (first.floor ?? 0) - (second.floor ?? 0);
      if (floorCompare !== 0) return floorCompare;
      return first.roomNumber.localeCompare(second.roomNumber);
    });

    const total = rooms.length;
    const parsedLimit = Number.parseInt(String(limit || total || 0), 10);
    const parsedOffset = Number.parseInt(String(offset || 0), 10);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : total;
    const safeOffset =
      Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
    const data = rooms.slice(safeOffset, safeOffset + safeLimit);

    res.json({
      data,
      meta: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  } catch (error) {
    sendInternalError(res);
  }
}

export async function updateRoom(req, res) {
  try {
    const roomId = String(req.params.id || "").trim();
    const [buildingId, nodeId] = roomId.split(":");

    if (!buildingId || !nodeId) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "Invalid room id");
    }

    const roomNumber = String(req.body?.roomNumber || "")
      .trim()
      .toUpperCase();
    const roomName = String(req.body?.roomName || "").trim();

    if (!roomNumber) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "roomNumber is required");
    }

    const graphRow = await prisma.navigationGraph.findUnique({
      where: {
        building_id: buildingId,
      },
      include: {
        building: true,
      },
    });

    if (!graphRow) {
      return sendError(res, API_ERRORS.NOT_FOUND, "Navigation graph not found");
    }

    const graphData = graphRow.graph_data || {};
    const node = graphData[nodeId];

    if (!node || String(node.type || "").toLowerCase() !== "room_door") {
      return sendError(res, API_ERRORS.NOT_FOUND, "Room node not found");
    }

    const nextNode = {
      ...node,
      label: buildRoomLabel(roomNumber, roomName),
    };

    const nextGraphData = {
      ...graphData,
      [nodeId]: nextNode,
    };

    const updated = await prisma.navigationGraph.update({
      where: {
        building_id: buildingId,
      },
      data: {
        graph_data: nextGraphData,
      },
      include: {
        building: true,
      },
    });

    res.json({
      data: mapRoomFromNode(updated, nextNode),
    });
  } catch (_error) {
    sendInternalError(res);
  }
}
