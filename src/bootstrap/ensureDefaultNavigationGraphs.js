import fs from "node:fs";
import path from "node:path";
import { prisma } from "../prismaClient.js";

const GRAPHS_DIR = path.resolve(process.cwd(), "assets/navigation_graphs");

function getBuildingCodeFromFileName(fileName) {
  const match = String(fileName || "").match(
    /^building_([A-Z]+)_unified\.json$/i,
  );
  return match ? match[1].toUpperCase() : null;
}

function readGraphFiles() {
  if (!fs.existsSync(GRAPHS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(GRAPHS_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => ({
      fileName,
      filePath: path.join(GRAPHS_DIR, fileName),
      buildingCode: getBuildingCodeFromFileName(fileName),
    }))
    .filter((entry) => Boolean(entry.buildingCode));
}

export async function ensureDefaultNavigationGraphs() {
  const existingGraphCount = await prisma.navigationGraph.count();
  if (existingGraphCount > 0) {
    return;
  }

  const graphFiles = readGraphFiles();
  if (graphFiles.length === 0) {
    console.warn(
      `No navigation graph files found in ${GRAPHS_DIR}. Skipping graph bootstrap.`,
    );
    return;
  }

  const campuses = await prisma.campus.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const preferredCampus =
    campuses.find(
      (campus) => String(campus.name || "").toLowerCase() === "ottawa",
    ) || campuses[0] || null;

  if (!preferredCampus) {
    throw new Error("No campus available to seed navigation graphs.");
  }

  const buildingsByCode = new Map();

  for (const graphFile of graphFiles) {
    const buildingCode = graphFile.buildingCode;

    const building = await prisma.building.upsert({
      where: {
        building_id: buildingCode,
      },
      create: {
        building_id: buildingCode,
        campus_id: preferredCampus.id,
        code: buildingCode,
        name: `${buildingCode} Building`,
      },
      update: {
        campus_id: preferredCampus.id,
        code: buildingCode,
        name: `${buildingCode} Building`,
      },
    });

    buildingsByCode.set(buildingCode, building);
  }

  let importedCount = 0;

  for (const graphFile of graphFiles) {
    const building = buildingsByCode.get(graphFile.buildingCode);
    if (!building) continue;

    const raw = fs.readFileSync(graphFile.filePath, "utf8");
    const graphData = JSON.parse(raw);

    await prisma.navigationGraph.upsert({
      where: {
        building_id: building.building_id,
      },
      create: {
        building_id: building.building_id,
        graph_data: graphData,
        source_file: graphFile.fileName,
      },
      update: {
        graph_data: graphData,
        source_file: graphFile.fileName,
      },
    });

    importedCount += 1;
  }

  console.log(`Seeded ${importedCount} navigation graph(s).`);
}
