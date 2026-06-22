import { query } from '../db.js';

export async function getAll(req, res) {
  try {
    const { campus_id, campusId, limit = 100, offset = 0 } = req.query;
    const campus = campus_id || campusId;
    let sql =
      'SELECT building_id, campus_id, code, name, created_at FROM buildings WHERE 1=1';
    const params = [];
    let i = 1;
    if (campus) {
      params.push(campus);
      sql += ` AND campus_id = $${i++}`;
    }
    sql += ` ORDER BY name LIMIT $${i++} OFFSET $${i}`;
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
      'SELECT building_id, campus_id, code, name, created_at FROM buildings WHERE building_id = $1',
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
    const { building_id, campus_id, code, name } = req.body;
    if (!building_id || !campus_id || !name) {
      return res.status(400).json({ error: 'building_id, campus_id, name required' });
    }
    await query(
      'INSERT INTO buildings (building_id, campus_id, code, name) VALUES ($1, $2, $3, $4)',
      [building_id, campus_id, code ?? null, name]
    );
    res.status(201).json({ building_id, campus_id, code, name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const { campus_id, code, name } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (campus_id !== undefined) {
      updates.push(`campus_id = $${i++}`);
      params.push(campus_id);
    }
    if (code !== undefined) {
      updates.push(`code = $${i++}`);
      params.push(code);
    }
    if (name !== undefined) {
      updates.push(`name = $${i++}`);
      params.push(name);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const result = await query(
      `UPDATE buildings SET ${updates.join(', ')} WHERE building_id = $1 RETURNING building_id, campus_id, code, name, created_at`,
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
      'DELETE FROM buildings WHERE building_id = $1 RETURNING building_id',
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
