import { randomUUID } from "node:crypto";
import { prisma } from "../prismaClient.js";

const DEFAULT_CAMPUS_NAME = "Main Campus";

export async function ensureDefaultCampus() {
  const campusCount = await prisma.campus.count();
  if (campusCount > 0) {
    return;
  }

  await prisma.campus.create({
    data: {
      id: randomUUID(),
      name: DEFAULT_CAMPUS_NAME,
    },
  });

  console.log(`Seeded default campus: ${DEFAULT_CAMPUS_NAME}`);
}
