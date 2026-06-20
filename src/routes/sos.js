import { Router } from 'express';
import { query } from '../db.js';
import crypto from 'crypto';

export const sosRouter = Router();

// POST /api/v1/sos/trigger — Trigger SOS
sosRouter.post('/trigger', async (req, res) => {
  try {
    const { deviceInstallationId, estimatedFloor } = req.body || {};
    const did = deviceInstallationId || req.headers['x-device-installation-id'];
    if (!did) return res.status(400).json({ error: 'deviceInstallationId required (body or X-Device-Installation-Id)' });
    const sosEventId = crypto.randomUUID();
    await query(
      `INSERT INTO sos_events (sos_event_id, device_installation_id, status, estimated_floor_id)
       VALUES ($1, $2, 'active', $3)`,
      [sosEventId, did, estimatedFloor && typeof estimatedFloor === 'string' ? estimatedFloor : null]
    );
    res.status(201).json({ sosEventId, status: 'active' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/sos/end/:sosId — End SOS
sosRouter.post('/end/:sosId', async (req, res) => {
  try {
    const result = await query(
      "UPDATE sos_events SET status = 'ended', ended_at = NOW() WHERE sos_event_id = $1 RETURNING sos_event_id, status, ended_at",
      [req.params.sosId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/sos — list SOS events (query: status, limit, offset)
sosRouter.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT sos_event_id, device_installation_id, status, created_at, ended_at, estimated_floor_id FROM sos_events WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { params.push(status); sql += ` AND status = $${i++}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/sos/:id — get one SOS event
sosRouter.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT sos_event_id, device_installation_id, status, created_at, ended_at, estimated_floor_id FROM sos_events WHERE sos_event_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/v1/sos/:id — update SOS status
sosRouter.patch('/:id', async (req, res) => {
  try {
    const { status, ended_at } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (status !== undefined) { updates.push(`status = $${i++}`); params.push(status); }
    if (ended_at !== undefined) { updates.push(`ended_at = $${i++}`); params.push(ended_at); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const result = await query(
      `UPDATE sos_events SET ${updates.join(', ')} WHERE sos_event_id = $1 RETURNING sos_event_id, device_installation_id, status, created_at, ended_at, estimated_floor_id`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
