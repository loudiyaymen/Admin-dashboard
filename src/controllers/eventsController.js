import { query } from "../db.js";
import crypto from "crypto";
// comment to commit

function isAdmin(req) {
  return req.headers["x-admin"] === "true";
}

export async function getAll(req, res) {
  try {
    const admin = isAdmin(req);
    const {
      campus_id,
      building_id,
      floor_id,
      place_id,
      limit = 50,
      offset = 0,
    } = req.query;

    let sql =
      "SELECT id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id, created_at, is_approved FROM events WHERE 1=1";
    const params = [];
    let i = 1;

    if (campus_id) {
      sql += ` AND campus_id = $${i++}`;
      params.push(campus_id);
    }
    if (building_id) {
      sql += ` AND building_id = $${i++}`;
      params.push(building_id);
    }
    if (floor_id) {
      sql += ` AND floor_id = $${i++}`;
      params.push(floor_id);
    }
    if (place_id) {
      sql += ` AND place_id = $${i++}`;
      params.push(place_id);
    }
    if (!admin) {
      sql += " AND is_approved = true";
    }

    sql += ` ORDER BY start_time DESC NULLS LAST, created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const result = await query(sql, params);
    res.json({ data: result.rows });
    console.log("ADMIN:", admin);
    console.log("SQL:", sql);
    console.log("PARAMS:", params);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getOne(req, res) {
  try {
    const result = await query("SELECT * FROM events WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createOne(req, res) {
  try {
    const admin = isAdmin(req);
    const {
      title,
      description,
      start_time,
      end_time,
      campus_id,
      building_id,
      floor_id,
      place_id,
    } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const id = crypto.randomUUID();
    const is_approved = admin;
    const created_by_admin_id = admin ? 1 : null;
    const result = await query(
      "INSERT INTO events (id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
        id,
        title,
        description ?? null,
        start_time ?? null,
        end_time ?? null,
        campus_id ?? null,
        building_id ?? null,
        floor_id ?? null,
        place_id ?? null,
        created_by_admin_id,
        is_approved,
      ],
    );
    console.log("INSERT RESULT:", result);
    res.status(201).json({
      id,
      title,
      is_approved,
    });
    console.log(req.headers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const fields = [
      "title",
      "description",
      "start_time",
      "end_time",
      "campus_id",
      "building_id",
      "floor_id",
      "place_id",
    ];
    const updates = [];
    const params = [req.params.id];
    let i = 2;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${i++}`);
        params.push(req.body[field]);
      }
    });
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const result = await query(
      `UPDATE events SET ${updates.join(", ")} WHERE id = $1 RETURNING *`,
      params,
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteOne(req, res) {
  try {
    const result = await query(
      "DELETE FROM events WHERE id = $1 RETURNING id",
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function approveEvent(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Admin only" });
    }

    const result = await query(
      `UPDATE events SET is_approved = true WHERE id = $1 RETURNING *`,
      [req.params.id],
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function denyEvent(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Admin only" });
    }

    const result = await query(
      `DELETE FROM events WHERE id = $1 RETURNING id`,
      [req.params.id],
    );

    res.json({
      message: "Event rejected",
      event: result.rows[0],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
