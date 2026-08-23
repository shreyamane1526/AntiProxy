import express from 'express';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/devices/register
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { deviceName, deviceIdentifier } = req.body;
    const studentId = req.user.profileId || req.user.id;

    if (!deviceName || !deviceIdentifier) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Device name and identifier are required' });
    }

    const devId = `dev-${Date.now()}`;
    const memory = getMemoryDb();

    if (isPg()) {
      // Revoke older active devices for MVP
      await query(`UPDATE registered_devices SET status = 'revoked' WHERE student_id = $1;`, [studentId]);
      await query(
        `INSERT INTO registered_devices (id, student_id, device_name, device_identifier, status) VALUES ($1,$2,$3,$4,'active');`,
        [devId, studentId, deviceName, deviceIdentifier]
      );
    } else {
      memory.registered_devices.forEach((d) => {
        if (d.student_id === studentId) d.status = 'revoked';
      });
      memory.registered_devices.push({
        id: devId,
        student_id: studentId,
        device_name: deviceName,
        device_identifier: deviceIdentifier,
        status: 'active',
        registered_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      deviceId: devId,
      deviceName,
      deviceIdentifier,
      status: 'active',
      message: 'Device successfully registered to student profile',
    });
  } catch (err) {
    res.status(500).json({ error: 'DEVICE_REGISTRATION_FAILED', message: err.message });
  }
});

// GET /api/devices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.profileId || req.user.id;
    const memory = getMemoryDb();
    let devices = [];

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM registered_devices WHERE student_id = $1;`, [studentId]);
      devices = dbRes.rows;
    } else {
      devices = memory.registered_devices.filter((d) => d.student_id === studentId);
    }

    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: 'DEVICE_FETCH_FAILED', message: err.message });
  }
});

// POST /api/devices/:id/revoke
router.post('/:id/revoke', authenticateToken, async (req, res) => {
  try {
    const devId = req.params.id;
    const memory = getMemoryDb();

    if (isPg()) {
      await query(`UPDATE registered_devices SET status = 'revoked' WHERE id = $1;`, [devId]);
    } else {
      const dev = memory.registered_devices.find((d) => d.id === devId);
      if (dev) dev.status = 'revoked';
    }

    res.json({ success: true, message: 'Device registration revoked' });
  } catch (err) {
    res.status(500).json({ error: 'REVOKE_FAILED', message: err.message });
  }
});

export default router;
