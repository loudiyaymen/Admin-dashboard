import { query } from '../db.js';

export async function getAll(_req, res) {
  try {
    const result = await query(
      'SELECT campus_id, name, created_at FROM campuses ORDER BY name'
    );
    res.json({ data: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getOne(req, res) {
  try {
    const result = await query(
      'SELECT campus_id, name, created_at FROM campuses WHERE campus_id = $1',
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
    const { campus_id, name } = req.body;
    if (!campus_id || !name) {
      return res.status(400).json({ error: 'campus_id and name required' });
    }
    await query(
      'INSERT INTO campuses (campus_id, name) VALUES ($1, $2)',
      [campus_id, name]
    );
    res.status(201).json({ campus_id, name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name required' });
    }
    const result = await query(
      'UPDATE campuses SET name = $2 WHERE campus_id = $1 RETURNING campus_id, name, created_at',
      [req.params.id, name]
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
      'DELETE FROM campuses WHERE campus_id = $1 RETURNING campus_id',
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
