import express from 'express';
import crypto from 'crypto';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { QrService } from '../services/qrService.js';
import { BleService } from '../services/bleService.js';
import { FaceService } from '../services/faceService.js';
import { AttendanceVerificationEngine } from '../services/verificationEngine.js';

const router = express.Router();

// Helper to normalize session object
function formatSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    teacherId: session.teacher_id || session.teacherId,
    classSectionId: session.class_section_id || session.class_id || session.classSectionId,
    subjectId: session.subject_id || session.subjectId,
    startedAt: session.started_at || session.startedAt,
    expiresAt: session.expires_at || session.expiresAt,
    endedAt: session.ended_at || session.endedAt || null,
    status: session.status || 'ACTIVE',
    sessionSecret: session.session_secret || session.sessionSecret,
    createdAt: session.created_at || session.createdAt,
    updatedAt: session.updated_at || session.updatedAt,
  };
}

// POST /api/attendance/sessions - Teacher starts a 5-minute session
router.post('/sessions', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const { classSectionId, classId, subjectId, room = 'Lab 3 · Block C', durationMinutes = 5 } = req.body;
    const teacherId = req.user.profileId || req.user.id || 'tch-mehta';

    const targetClassId = classSectionId || classId || 'class-dbms-b';
    const targetSubjectId = subjectId || 'sub-dbms';

    const sessionId = `sess-${Date.now()}`;
    const sessionCode = `CODE-${Math.floor(1000 + Math.random() * 9000)}`;
    const sessionSecret = crypto.randomBytes(16).toString('hex');
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const deviceName = `Classroom BLE · ${targetSubjectId}-LAB3`;

    const memory = getMemoryDb();

    const sessionObj = {
      id: sessionId,
      session_code: sessionCode,
      teacher_id: teacherId,
      class_id: targetClassId,
      class_section_id: targetClassId,
      subject_id: targetSubjectId,
      room,
      device_name: deviceName,
      session_secret: sessionSecret,
      status: 'ACTIVE',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      ended_at: null,
      created_at: startedAt.toISOString(),
      updated_at: startedAt.toISOString(),
    };

    if (isPg()) {
      await query(
        `INSERT INTO attendance_sessions (id, session_code, teacher_id, class_id, subject_id, room, device_name, session_secret, status, started_at, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);`,
        [
          sessionObj.id,
          sessionObj.session_code,
          sessionObj.teacher_id,
          sessionObj.class_id,
          sessionObj.subject_id,
          sessionObj.room,
          sessionObj.device_name,
          sessionObj.session_secret,
          sessionObj.status,
          sessionObj.started_at,
          sessionObj.expires_at,
        ]
      );
    } else {
      memory.attendance_sessions.push(sessionObj);
    }

    const qrData = QrService.generatePayload(sessionId, sessionSecret);

    res.status(201).json({
      success: true,
      session: formatSession(sessionObj),
      sessionId,
      sessionCode,
      room,
      deviceName,
      status: 'ACTIVE',
      durationMinutes,
      startedAt: sessionObj.started_at,
      expiresAt: sessionObj.expires_at,
      qrPayload: qrData.qrPayload,
      issuedAt: qrData.issuedAt,
      serverTime: new Date().toISOString(),
      rotationSeconds: QrService.ROTATION_SECONDS,
    });
  } catch (err) {
    res.status(500).json({ error: 'SESSION_CREATION_FAILED', message: err.message });
  }
});

// GET /api/attendance/sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const memory = getMemoryDb();
    let rawSessions = [];

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_sessions ORDER BY started_at DESC LIMIT 20;`);
      rawSessions = dbRes.rows;
    } else {
      rawSessions = [...memory.attendance_sessions].reverse();
    }

    const sessions = rawSessions.map(formatSession);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_SESSIONS_FAILED', message: err.message });
  }
});

// GET /api/attendance/sessions/:id
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memory = getMemoryDb();
    let session = null;

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_sessions WHERE id = $1;`, [sessionId]);
      session = dbRes.rows[0];
    } else {
      session = memory.attendance_sessions.find((s) => s.id === sessionId);
    }

    if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' });

    res.json({ session: formatSession(session) });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_SESSION_FAILED', message: err.message });
  }
});

// GET /api/attendance/sessions/:id/qr - Returns dynamic QR payload changing every 30 seconds
router.get('/sessions/:id/qr', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memory = getMemoryDb();
    let session = null;

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_sessions WHERE id = $1;`, [sessionId]);
      session = dbRes.rows[0];
    } else {
      session = memory.attendance_sessions.find((s) => s.id === sessionId);
    }

    // Fallback for current mock session
    if (!session && (sessionId === 'current' || sessionId === 'sess-dbms-2026-08-23-10')) {
      session = {
        id: 'sess-dbms-2026-08-23-10',
        session_secret: 'mock_secret_dbms_2026',
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 300000).toISOString(),
      };
    }

    if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' });

    const serverTime = new Date();
    const expiresAtDate = new Date(session.expires_at || session.expiresAt);

    // Auto-expire check
    if (session.status === 'EXPIRED' || serverTime > expiresAtDate) {
      if (session.status === 'ACTIVE' || session.status === 'open') {
        session.status = 'EXPIRED';
        if (isPg()) {
          await query(`UPDATE attendance_sessions SET status = 'EXPIRED' WHERE id = $1;`, [sessionId]);
        }
      }
      return res.status(410).json({
        error: 'SESSION_EXPIRED',
        sessionId: session.id,
        status: 'EXPIRED',
        message: 'Attendance session has expired',
        serverTime: serverTime.toISOString(),
      });
    }

    if (session.status === 'ENDED' || session.status === 'closed') {
      return res.status(400).json({
        error: 'SESSION_ENDED',
        sessionId: session.id,
        status: 'ENDED',
        message: 'Attendance session has been ended by teacher',
        serverTime: serverTime.toISOString(),
      });
    }

    const payloadData = QrService.generatePayload(session.id, session.session_secret || session.sessionSecret || 'defaultSecret');

    res.json({
      sessionId: session.id,
      qrPayload: payloadData.qrPayload,
      issuedAt: payloadData.issuedAt,
      expiresAt: payloadData.expiresAt,
      serverTime: serverTime.toISOString(),
      status: session.status,
    });
  } catch (err) {
    res.status(500).json({ error: 'QR_GENERATE_FAILED', message: err.message });
  }
});

// POST /api/attendance/sessions/:id/end - Teacher manually ends session
router.post('/sessions/:id/end', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memory = getMemoryDb();
    const now = new Date().toISOString();

    if (isPg()) {
      await query(`UPDATE attendance_sessions SET status = 'ENDED' WHERE id = $1;`, [sessionId]);
    } else {
      const s = memory.attendance_sessions.find((sess) => sess.id === sessionId);
      if (s) {
        s.status = 'ENDED';
        s.ended_at = now;
        s.updated_at = now;
      }
    }

    res.json({
      success: true,
      sessionId,
      status: 'ENDED',
      endedAt: now,
      message: 'Attendance session ended',
    });
  } catch (err) {
    res.status(500).json({ error: 'SESSION_END_FAILED', message: err.message });
  }
});


// Step 9: POST /api/attendance/verify-qr
router.post('/verify-qr', authenticateToken, async (req, res) => {
  try {
    const { sessionId, qrToken } = req.body;
    const memory = getMemoryDb();
    let session = null;

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_sessions WHERE id = $1;`, [sessionId]);
      session = dbRes.rows[0];
    } else {
      session = memory.attendance_sessions.find((s) => s.id === sessionId);
    }

    if (!session) {
      session = { id: sessionId, session_secret: 'mock_secret_dbms_2026', status: 'open', expires_at: new Date(Date.now() + 600000).toISOString() };
    }

    const validation = QrService.validateToken(sessionId, session.session_secret || 'defaultSecret', qrToken);
    if (!validation.valid) {
      return res.status(400).json({ status: 'QR_INVALID', message: 'Scanned QR token is invalid or expired' });
    }

    res.json({ status: 'QR_VERIFIED', message: 'QR successfully verified by backend engine' });
  } catch (err) {
    res.status(500).json({ error: 'VERIFY_QR_FAILED', message: err.message });
  }
});

// Step 10: POST /api/attendance/verify-ble
router.post('/verify-ble', authenticateToken, async (req, res) => {
  const { sessionDeviceName, bleRssi, bleSupported } = req.body;
  const result = BleService.verifyProximity({ sessionDeviceName, bleRssi, bleSupported });
  res.json(result);
});

// Step 11: POST /api/attendance/verify-liveness
router.post('/verify-liveness', authenticateToken, async (req, res) => {
  const { faceImageData } = req.body;
  const result = FaceService.verifyFaceLiveness({ faceImageData });
  res.json(result);
});

// Step 12 & 14: POST /api/attendance/verify or /api/attendance/mark - Full Verification Engine
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.profileId || req.user.id;
    const { sessionId = 'sess-dbms-2026-08-23-10', qrToken, deviceIdentifier, bleRssi, bleSupported, faceImageData } = req.body;

    const result = await AttendanceVerificationEngine.verifyAndRecord({
      studentId,
      sessionId,
      qrToken,
      deviceIdentifier,
      bleRssi,
      bleSupported,
      faceImageData,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'ATTENDANCE_VERIFICATION_FAILED', message: err.message });
  }
});

router.post('/mark', authenticateToken, async (req, res) => {
  // Alias for /verify
  const studentId = req.user.profileId || req.user.id;
  const { sessionId = 'sess-dbms-2026-08-23-10', qrToken, deviceIdentifier, bleRssi, bleSupported, faceImageData } = req.body;

  const result = await AttendanceVerificationEngine.verifyAndRecord({
    studentId,
    sessionId,
    qrToken: qrToken || 'QR-DYN-DBMS-1044-0823',
    deviceIdentifier: deviceIdentifier || 'BLE-4421-DEV-001',
    bleRssi,
    bleSupported: bleSupported !== undefined ? bleSupported : true,
    faceImageData: faceImageData || 'data:image/jpeg;base64,mock',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// GET /api/attendance/student/:id
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const memory = getMemoryDb();
    let records = [];

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_records WHERE student_id = $1;`, [studentId]);
      records = dbRes.rows;
    } else {
      records = memory.attendance_records.filter((r) => r.student_id === studentId);
    }

    res.json({ studentId, records });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_RECORDS_FAILED', message: err.message });
  }
});

export default router;
