import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import request from "supertest";

const calls = {
  prismaReportCreate: 0,
  prismaReportFindMany: 0,
  prismaReportUpdate: 0,
  prismaSosLogCreate: 0,
  prismaSosEventCreate: 0,
  prismaSosEventFindMany: 0,
  prismaEventFindMany: 0,
  prismaCampusFindMany: 0,
  prismaCampusCreate: 0,
  prismaAlertCreate: 0,
  prismaAlertFindMany: 0,
  prismaBuildingFindMany: 0,
  prismaFloorFindMany: 0,
  prismaAnnouncementFindMany: 0,
};

const mockQuery = async (sql, params = []) => {
  const text = String(sql);

  if (/COUNT\(\*\)/i.test(text)) {
    return { rows: [{ count: "0" }], rowCount: 1 };
  }

  if (/RETURNING/i.test(text)) {
    return {
      rows: [
        {
          id: 1,
          sos_event_id: params[0] ?? "sos-1",
          status: "active",
          announcement_id: "ann-1",
          alert_id: "alert-1",
        },
      ],
      rowCount: 1,
    };
  }

  if (/^\s*(SELECT|WITH)\b/i.test(text)) {
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 1 };
};

const mockPrismaClient = {
  alert: {
    findMany: async () => {
      calls.prismaAlertFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.alert_id === "missing"
        ? null
        : { alert_id: where.alert_id, message: "Alert" },
    create: async ({ data }) => {
      calls.prismaAlertCreate += 1;
      return { ...data };
    },
    update: async ({ where, data }) => ({ alert_id: where.alert_id, ...data }),
    delete: async ({ where }) => ({ alert_id: where.alert_id }),
  },
  announcement: {
    findMany: async () => {
      calls.prismaAnnouncementFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.announcement_id === "missing"
        ? null
        : { announcement_id: where.announcement_id, title: "Announcement" },
    create: async ({ data }) => ({ ...data }),
    update: async ({ where, data }) => ({
      announcement_id: where.announcement_id,
      ...data,
    }),
    delete: async ({ where }) => ({ announcement_id: where.announcement_id }),
  },
  building: {
    findMany: async () => {
      calls.prismaBuildingFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.building_id === "missing"
        ? null
        : { building_id: where.building_id, name: "Building" },
    create: async ({ data }) => ({ ...data }),
    update: async ({ where, data }) => ({
      building_id: where.building_id,
      ...data,
    }),
    delete: async ({ where }) => ({ building_id: where.building_id }),
  },
  campus: {
    findMany: async () => {
      calls.prismaCampusFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.id === "missing"
        ? null
        : {
            id: where.id,
            name: "Campus",
            created_at: new Date().toISOString(),
          },
    create: async ({ data }) => {
      calls.prismaCampusCreate += 1;
      return {
        id: data.id,
        name: data.name,
        created_at: new Date().toISOString(),
      };
    },
    update: async ({ where, data }) => ({
      id: where.id,
      name: data.name,
      created_at: new Date().toISOString(),
    }),
    delete: async ({ where }) => {
      if (where.id === "missing") {
        const err = new Error("Record to delete does not exist.");
        err.code = "P2025";
        throw err;
      }
      return { id: where.id };
    },
  },
  report: {
    create: async ({ data }) => {
      calls.prismaReportCreate += 1;
      return {
        id: "report-1",
        status: "pending",
        created_at: new Date().toISOString(),
        ...data,
      };
    },
    findMany: async () => {
      calls.prismaReportFindMany += 1;
      return [];
    },
    count: async () => 0,
    findUnique: async ({ where }) =>
      where.id === "missing"
        ? null
        : {
            id: where.id,
            incident_type: "lostandfound",
            description: "desc",
            status: "pending",
            created_at: new Date().toISOString(),
            campus_id: "campus-1",
            user_id: null,
            photo_url: null,
          },
    update: async ({ where, data }) => {
      calls.prismaReportUpdate += 1;
      if (where.id === "missing") {
        const err = new Error("Record to update does not exist.");
        err.code = "P2025";
        throw err;
      }
      return {
        id: where.id,
        incident_type: "lostandfound",
        description: "desc",
        status: data.status,
        created_at: new Date().toISOString(),
        campus_id: "campus-1",
        user_id: null,
        photo_url: null,
      };
    },
    delete: async ({ where }) => {
      if (where.id === "missing") {
        const err = new Error("Record to delete does not exist.");
        err.code = "P2025";
        throw err;
      }
      return { id: where.id };
    },
  },
  sosLog: {
    create: async ({ data }) => {
      calls.prismaSosLogCreate += 1;
      return { id: "soslog-1", ...data };
    },
  },
  sosEvent: {
    create: async ({ data }) => {
      calls.prismaSosEventCreate += 1;
      return { ...data };
    },
    findMany: async () => {
      calls.prismaSosEventFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.sos_event_id === "missing"
        ? null
        : { sos_event_id: where.sos_event_id, status: "active" },
    update: async ({ where, data }) => ({
      sos_event_id: where.sos_event_id,
      status: data.status ?? "active",
      ended_at: data.ended_at ?? null,
    }),
  },
  floor: {
    findMany: async () => {
      calls.prismaFloorFindMany += 1;
      return [];
    },
    findUnique: async ({ where }) =>
      where.floor_id === "missing"
        ? null
        : { floor_id: where.floor_id, building_id: "b-1" },
    create: async ({ data }) => ({ ...data }),
    update: async ({ where, data }) => ({ floor_id: where.floor_id, ...data }),
    delete: async ({ where }) => ({ floor_id: where.floor_id }),
  },
  event: {
    findMany: async () => {
      calls.prismaEventFindMany += 1;
      return [];
    },
    findUnique: async () => null,
    create: async (data) => ({ id: "event-1", ...data }),
    update: async ({ where, data }) => ({ id: where.id, ...data }),
    delete: async () => ({}),
  },
  eventParticipant: {
    findMany: async () => [],
  },
};

mock.module("../src/prismaClient.js", {
  namedExports: {
    prisma: mockPrismaClient,
  },
});

mock.module("../src/websocket.js", {
  namedExports: {
    broadcast: () => {},
    wss: { clients: new Set(), on: () => {} },
  },
});

let app;

before(async () => {
  const mod = await import("../src/app.js");
  app = mod.app;
});

describe("Route Tests", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  it("GET list routes return 200", async () => {
    const paths = [
      "/api/v1/campuses",
      "/api/v1/buildings",
      "/api/v1/floors",
      "/api/v1/announcements",
      "/api/v1/alerts",
      "/api/v1/sos",
      "/api/v1/reports",
      "/api/v1/events",
    ];

    for (const path of paths) {
      const res = await request(app).get(path);
      assert.equal(res.status, 200, `Expected 200 for ${path}`);
    }

    assert.ok(calls.prismaEventFindMany > 0);
    assert.ok(calls.prismaCampusFindMany > 0);
    assert.ok(calls.prismaReportFindMany > 0);
    assert.ok(calls.prismaBuildingFindMany > 0);
    assert.ok(calls.prismaFloorFindMany > 0);
    assert.ok(calls.prismaAnnouncementFindMany > 0);
    assert.ok(calls.prismaAlertFindMany > 0);
    assert.ok(calls.prismaSosEventFindMany > 0);
  });

  it("POST /api/v1/alerts/create inserts global alert", async () => {
    const createCountBefore = calls.prismaAlertCreate;
    const res = await request(app)
      .post("/api/v1/alerts/create")
      .send({ message: "System maintenance at 8pm" });

    assert.equal(res.status, 201);
    assert.ok(calls.prismaAlertCreate > createCountBefore);
  });

  it("POST /api/v1/alerts creates standard alert", async () => {
    const res = await request(app).post("/api/v1/alerts").send({
      alert_id: "alert-123",
      message: "Building closed",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.alert_id, "alert-123");
  });

  it("PATCH /api/v1/alerts/:id updates alert", async () => {
    const res = await request(app)
      .patch("/api/v1/alerts/alert-123")
      .send({ message: "Updated alert" });

    assert.equal(res.status, 200);
  });

  it("POST /api/v1/sos/trigger writes SOS event and log", async () => {
    const res = await request(app).post("/api/v1/sos/trigger").send({
      deviceInstallationId: "dev-1",
      campusId: "campus-1",
      userId: null,
    });

    assert.equal(res.status, 201);
    assert.ok(calls.prismaSosEventCreate > 0);
    assert.ok(calls.prismaSosLogCreate > 0);
  });

  it("POST /api/v1/sos/trigger validates required campusId", async () => {
    const res = await request(app).post("/api/v1/sos/trigger").send({
      deviceInstallationId: "dev-1",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "campusId required");
  });

  it("POST /api/v1/reports with campus_id uses prisma", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .field("type", "lost_item")
      .field("description", "Lost backpack")
      .field("campus_id", "campus-1");

    assert.equal(res.status, 201);
    assert.ok(calls.prismaReportCreate > 0);
  });

  it("PATCH /api/v1/reports/:id validates and maps status", async () => {
    const res = await request(app)
      .patch("/api/v1/reports/report-1")
      .send({ status: "in_review" });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "in_review");
    assert.ok(calls.prismaReportUpdate > 0);
  });

  it("PATCH /api/v1/reports/:id rejects invalid status", async () => {
    const res = await request(app)
      .patch("/api/v1/reports/report-1")
      .send({ status: "bad_status" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Invalid status value");
  });

  it("POST /api/v1/campuses uses typed prisma", async () => {
    const res = await request(app).post("/api/v1/campuses").send({
      campus_id: "11111111-1111-1111-1111-111111111111",
      name: "Main",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.campus_id, "11111111-1111-1111-1111-111111111111");
    assert.ok(calls.prismaCampusCreate > 0);
  });
});
