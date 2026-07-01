import crypto from 'crypto';
import { query } from '../db.js';
import { prisma } from '../prismaClient.js';
import { broadcast } from '../websocket.js';

export async function getAll(req, res) {
  try {
    const {
      alert_type,
      campus_id,
      building_id,
      severity,
      limit = 50,
      offset = 0,
    } = req.query;
    let sql =
      'SELECT alert_id, alert_type, message, severity, campus_id, building_id, starts_at, ends_at, created_by_admin_id, created_at FROM alerts WHERE 1=1';
    const params = [];
    let i = 1;
    if (alert_type) {
      params.push(alert_type);
      sql += ` AND alert_type = $${i++}`;
    }
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
    sql += ` ORDER BY starts_at DESC NULLS LAST, created_at DESC LIMIT $${i++} OFFSET $${i}`;
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
      'SELECT alert_id, alert_type, message, severity, campus_id, building_id, starts_at, ends_at, created_by_admin_id, created_at FROM alerts WHERE alert_id = $1',
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
      alert_id,
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
      created_by_admin_id,
    } = req.body;
    if (!alert_id || !message) {
      return res.status(400).json({ error: 'alert_id and message required' });
    }
    await query(
      'INSERT INTO alerts (alert_id, alert_type, message, severity, campus_id, building_id, starts_at, ends_at, created_by_admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        alert_id,
        alert_type ?? null,
        message,
        severity ?? null,
        campus_id ?? null,
        building_id ?? null,
        starts_at ?? null,
        ends_at ?? null,
        created_by_admin_id ?? null,
      ]
    );
    res.status(201).json({
      alert_id,
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const {
      alert_type,
      message,
      severity,
      campus_id,
      building_id,
      starts_at,
      ends_at,
    } = req.body;
    const updates = [];
    const params = [req.params.id];
    let i = 2;
    if (alert_type !== undefined) {
      updates.push(`alert_type = $${i++}`);
      params.push(alert_type);
    }
    if (message !== undefined) {
      updates.push(`message = $${i++}`);
      params.push(message);
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
    if (starts_at !== undefined) {
      updates.push(`starts_at = $${i++}`);
      params.push(starts_at);
    }
    if (ends_at !== undefined) {
      updates.push(`ends_at = $${i++}`);
      params.push(ends_at);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const result = await query(
      `UPDATE alerts SET ${updates.join(', ')} WHERE alert_id = $1 RETURNING alert_id, alert_type, message, severity, campus_id, building_id, starts_at, ends_at, created_by_admin_id, created_at`,
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
      'DELETE FROM alerts WHERE alert_id = $1 RETURNING alert_id',
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

export async function createGlobalAlert(req, res) {
  try {
    const {
      message,
      alert_type,
      severity,
      starts_at,
      ends_at,
      created_by_admin_id,
    } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'message required' });
    }
    const alert_id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO alerts (
        alert_id,
        alert_type,
        message,
        severity,
        campus_id,
        building_id,
        starts_at,
        ends_at,
        created_by_admin_id
      ) VALUES (
        ${alert_id},
        ${alert_type ?? null},
        ${message.trim()},
        ${severity ?? null},
        ${null},
        ${null},
        ${starts_at ? new Date(starts_at) : null},
        ${ends_at ? new Date(ends_at) : null},
        ${created_by_admin_id ?? null}
      )
    `;
    broadcast('ALERT_CREATED');
    broadcast('PUSH_ALERT');
    res.status(201).json({
      alert_id,
      alert_type: alert_type ?? null,
      message: message.trim(),
      severity: severity ?? null,
      campus_id: null,
      building_id: null,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
