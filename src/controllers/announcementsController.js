import { query } from '../db.js';

export async function getAll(req, res) {
  try {
    const { campus_id, building_id, severity, limit = 50, offset = 0 } = req.query;
    let sql =
      'SELECT announcement_id, title, body, severity, campus_id, building_id, published_at, expires_at, created_by_admin_id, created_at FROM announcements WHERE 1=1';
    const params = [];
    let i = 1;
    if (campus_id) {
      params.push(campus_id);
      sql += ` AND campus_id = $${i++}`;
    }
    if (building_id) {
      params.push(building_id);
      sql += ` AND building_id = $${i++}`;
    }
    if (severity) {
      params.push(severity);
      sql += ` AND severity = $${i++}`;
    }
    sql += ` ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getOne(req, res) {
  try {
    const result = await query(
      'SELECT announcement_id, title, body, severity, campus_id, building_id, published_at, expires_at, created_by_admin_id, created_at FROM announcements WHERE announcement_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createOne(req, res) {
  try {
    const {
      announcement_id,
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
      created_by_admin_id,
    } = req.body;
    if (!announcement_id || !title) {
      return res.status(400).json({ error: 'announcement_id and title required' });
    }
    await query(
      'INSERT INTO announcements (announcement_id, title, body, severity, campus_id, building_id, published_at, expires_at, created_by_admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        announcement_id,
        title,
        body ?? null,
        severity ?? null,
        campus_id ?? null,
        building_id ?? null,
        published_at ?? null,
        expires_at ?? null,
        created_by_admin_id ?? null,
      ]
    );
    res.status(201).json({
      announcement_id,
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const {
      title,
      body,
      severity,
      campus_id,
      building_id,
      published_at,
      expires_at,
    } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (title !== undefined) {
      updates.push(`title = $${i++}`);
      params.push(title);
    }
    if (body !== undefined) {
      updates.push(`body = $${i++}`);
      params.push(body);
    }
    if (severity !== undefined) {
      updates.push(`severity = $${i++}`);
      params.push(severity);
    }
    if (campus_id !== undefined) {
      updates.push(`campus_id = $${i++}`);
      params.push(campus_id);
    }
    if (building_id !== undefined) {
      updates.push(`building_id = $${i++}`);
      params.push(building_id);
    }
    if (published_at !== undefined) {
      updates.push(`published_at = $${i++}`);
      params.push(published_at);
    }
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${i++}`);
      params.push(expires_at);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const result = await query(
      `UPDATE announcements SET ${updates.join(', ')} WHERE announcement_id = $1 RETURNING announcement_id, title, body, severity, campus_id, building_id, published_at, expires_at, created_by_admin_id, created_at`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteOne(req, res) {
  try {
    const result = await query(
      'DELETE FROM announcements WHERE announcement_id = $1 RETURNING announcement_id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
