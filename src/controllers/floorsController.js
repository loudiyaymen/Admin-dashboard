import { query } from '../db.js';

export async function getAll(req, res) {
  try {
    const { building_id, buildingId, limit = 100, offset = 0 } = req.query;
    const building = building_id || buildingId;
    let sql =
      'SELECT floor_id, building_id, floor_number, floor_label, elevation_meters, map_asset_key, created_at FROM floors WHERE 1=1';
    const params = [];
    let i = 1;
    if (building) {
      params.push(building);
      sql += ` AND building_id = $${i++}`;
    }
    sql += ` ORDER BY building_id, floor_number LIMIT $${i++} OFFSET $${i}`;
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
      'SELECT floor_id, building_id, floor_number, floor_label, elevation_meters, map_asset_key, created_at FROM floors WHERE floor_id = $1',
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
      floor_id,
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    } = req.body;
    if (!floor_id || !building_id) {
      return res
        .status(400)
        .json({ error: 'floor_id and building_id required' });
    }
    await query(
      'INSERT INTO floors (floor_id, building_id, floor_number, floor_label, elevation_meters, map_asset_key) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        floor_id,
        building_id,
        floor_number ?? null,
        floor_label ?? null,
        elevation_meters ?? null,
        map_asset_key ?? null,
      ]
    );
    res.status(201).json({
      floor_id,
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const {
      building_id,
      floor_number,
      floor_label,
      elevation_meters,
      map_asset_key,
    } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (building_id !== undefined) {
      updates.push(`building_id = $${i++}`);
      params.push(building_id);
    }
    if (floor_number !== undefined) {
      updates.push(`floor_number = $${i++}`);
      params.push(floor_number);
    }
    if (floor_label !== undefined) {
      updates.push(`floor_label = $${i++}`);
      params.push(floor_label);
    }
    if (elevation_meters !== undefined) {
      updates.push(`elevation_meters = $${i++}`);
      params.push(elevation_meters);
    }
    if (map_asset_key !== undefined) {
      updates.push(`map_asset_key = $${i++}`);
      params.push(map_asset_key);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const result = await query(
      `UPDATE floors SET ${updates.join(
        ', '
      )} WHERE floor_id = $1 RETURNING floor_id, building_id, floor_number, floor_label, elevation_meters, map_asset_key, created_at`,
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
      'DELETE FROM floors WHERE floor_id = $1 RETURNING floor_id',
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

