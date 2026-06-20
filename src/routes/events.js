import { Router } from 'express';
import { query } from '../db.js';

export const eventsRouter = Router();

// GET /api/events — list events (filters: campus_id, building_id, floor_id, place_id, limit, offset)
eventsRouter.get('/', async (req, res) => {
  try {
    const { campus_id, building_id, floor_id, place_id, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id, created_at FROM events WHERE 1=1';
    const params = [];
    let i = 1;
    if (campus_id) { params.push(campus_id); sql += ` AND campus_id = $${i++}`; }
    if (building_id) { params.push(building_id); sql += ` AND building_id = $${i++}`; }
    if (floor_id) { params.push(floor_id); sql += ` AND floor_id = $${i++}`; }
    if (place_id) { params.push(place_id); sql += ` AND place_id = $${i++}`; }
    sql += ` ORDER BY start_time DESC NULLS LAST, created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/events/:id — get one event
eventsRouter.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id, created_at FROM events WHERE event_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/events — create event
eventsRouter.post('/', async (req, res) => {
  try {
    const { event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id } = req.body;
    if (!event_id || !title) return res.status(400).json({ error: 'event_id and title required' });
    await query(
      'INSERT INTO events (event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [event_id, title, description ?? null, start_time ?? null, end_time ?? null, campus_id ?? null, building_id ?? null, floor_id ?? null, place_id ?? null, created_by_admin_id ?? null]
    );
    res.status(201).json({ event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/events/:id — update event
eventsRouter.patch('/:id', async (req, res) => {
  try {
    const { title, description, start_time, end_time, campus_id, building_id, floor_id, place_id } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (title !== undefined) { updates.push(`title = $${i++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${i++}`); params.push(description); }
    if (start_time !== undefined) { updates.push(`start_time = $${i++}`); params.push(start_time); }
    if (end_time !== undefined) { updates.push(`end_time = $${i++}`); params.push(end_time); }
    if (campus_id !== undefined) { updates.push(`campus_id = $${i++}`); params.push(campus_id); }
    if (building_id !== undefined) { updates.push(`building_id = $${i++}`); params.push(building_id); }
    if (floor_id !== undefined) { updates.push(`floor_id = $${i++}`); params.push(floor_id); }
    if (place_id !== undefined) { updates.push(`place_id = $${i++}`); params.push(place_id); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const result = await query(
      `UPDATE events SET ${updates.join(', ')} WHERE event_id = $1 RETURNING event_id, title, description, start_time, end_time, campus_id, building_id, floor_id, place_id, created_by_admin_id, created_at`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/events/:id
eventsRouter.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM events WHERE event_id = $1 RETURNING event_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
