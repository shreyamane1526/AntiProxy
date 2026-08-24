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
    slotDay: session.slot_day || session.slotDay || null,
    slotHour: session.slot_hour || session.slotHour || null,
    status: session.status || 'ACTIVE',
    sessionSecret: session.session_secret || session.sessionSecret,
    createdAt: session.created_at || session.createdAt,
    updatedAt: session.updated_at || session.updatedAt,
  };
}

// GET /api/attendance/teacher-assignments - Returns teacher assignments from DB
router.get('/teacher-assignments', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const teacherId = req.user.profileId || req.user.id;
    const memory = getMemoryDb();
    let assignments = [];

    if (isPg()) {
      const dbRes = await query(
        `SELECT 
           tsa.id,
           tsa.teacher_id,
           tsa.subject_id,
           tsa.class_id,
           c.name as class_name,
           c.division as class_division,
           c.code as class_code,
           c.type as class_type,
           s.name as subject_name,
           s.code as subject_code
         FROM teacher_subject_assignments tsa
         JOIN classes c ON tsa.class_id = c.id
         JOIN subjects s ON tsa.subject_id = s.id
         WHERE tsa.teacher_id = $1 OR tsa.teacher_id IN (SELECT id FROM teachers WHERE user_id = $1);`,
        [teacherId]
      );
      assignments = dbRes.rows;
    } else {
      const tch = memory.teachers.find((t) => t.id === teacherId || t.user_id === req.user.id);
      const tchId = tch ? tch.id : teacherId;
      const tsas = memory.teacher_subject_assignments.filter((a) => a.teacher_id === tchId);
      assignments = tsas.map((a) => {
        const cls = memory.classes.find((c) => c.id === a.class_id);
        const sub = memory.subjects.find((s) => s.id === a.subject_id);
        return {
          id: a.id,
          teacher_id: a.teacher_id,
          subject_id: a.subject_id,
          class_id: a.class_id,
          class_name: cls ? cls.name : 'Class',
          class_division: cls ? cls.division : 'CSE-A',
          class_code: cls ? cls.code : 'CSE-A',
          class_type: cls ? cls.type : 'Lecture',
          subject_name: sub ? sub.name : 'Subject',
          subject_code: sub ? sub.code : 'CS301',
        };
      });
    }

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_ASSIGNMENTS_FAILED', message: err.message });
  }
});

// POST /api/attendance/sessions - Teacher starts a 5-minute session
router.post('/sessions', authenticateToken, authorizeRoles('teacher', 'admin', 'hod'), async (req, res) => {
  try {
    const { classSectionId, classId, subjectId, room = 'Room 201', durationMinutes = 7, slotDay = null, slotHour = null } = req.body;
    const teacherId = req.user.profileId || req.user.id;

    let targetClassId = classSectionId || classId || 'cls-cse-a';
    let targetSubjectId = subjectId || 'sub-cs301';

    const memory = getMemoryDb();
    let isAssigned = false;

    if (isPg()) {
      // Resolve class id if division/code passed
      const clsRes = await query(
        `SELECT id FROM classes WHERE id = $1 OR division = $1 OR code = $1 LIMIT 1;`,
        [targetClassId]
      );
      if (clsRes.rows.length > 0) targetClassId = clsRes.rows[0].id;

      // Resolve subject id if code passed
      const subRes = await query(
        `SELECT id FROM subjects WHERE id = $1 OR code = $1 LIMIT 1;`,
        [targetSubjectId]
      );
      if (subRes.rows.length > 0) targetSubjectId = subRes.rows[0].id;

      const assignRes = await query(
        `SELECT tsa.id FROM teacher_subject_assignments tsa
         JOIN teachers t ON (tsa.teacher_id = t.id OR tsa.teacher_id = t.user_id)
         WHERE (t.id = $1 OR t.user_id = $1) AND tsa.subject_id = $2 AND tsa.class_id = $3;`,
        [teacherId, targetSubjectId, targetClassId]
      );
      isAssigned = assignRes.rows.length > 0;

      // Fallback: authorize if user is a valid teacher or HOD in database
      if (!isAssigned) {
        const tchRes = await query(
          `SELECT t.id FROM teachers t WHERE t.id = $1 OR t.user_id = $1
           UNION
           SELECT h.id FROM hods h WHERE h.id = $1 OR h.user_id = $1;`,
          [teacherId]
        );
        if (tchRes.rows.length > 0) isAssigned = true;
      }
    } else {
      const tch = memory.teachers.find((t) => t.id === teacherId || t.user_id === req.user.id);
      const tchId = tch ? tch.id : teacherId;
      isAssigned = memory.teacher_subject_assignments.some(
        (a) => a.teacher_id === tchId && (a.subject_id === targetSubjectId || a.subject_id.includes(targetSubjectId.toLowerCase())) && (a.class_id === targetClassId || a.class_id.includes(targetClassId.toLowerCase()))
      ) || Boolean(tch);
    }

    if (!isAssigned) {
      return res.status(403).json({
        error: 'UNAUTHORIZED_TEACHER',
        message: 'Teacher is not assigned to this class section and subject.',
      });
    }

    // Resolve teacher_id to actual teachers.id for FK compliance
    let resolvedTeacherId = teacherId;
    if (isPg()) {
      const tchLookup = await query(
        `SELECT id FROM teachers WHERE id = $1 OR user_id = $1 LIMIT 1;`,
        [teacherId]
      );
      if (tchLookup.rows.length > 0) {
        resolvedTeacherId = tchLookup.rows[0].id;
      }
    }

    // Auto-end any previously active sessions for this teacher before starting new one
    const autoEndTime = new Date().toISOString();
    if (isPg()) {
      await query(
        `UPDATE attendance_sessions SET status = 'EXPIRED', ended_at = $2 WHERE teacher_id = $1 AND status IN ('ACTIVE', 'open', 'OPEN');`,
        [resolvedTeacherId, autoEndTime]
      );
    } else {
      memory.attendance_sessions
        .filter((s) => s.teacher_id === teacherId && ['ACTIVE', 'open', 'OPEN'].includes(s.status))
        .forEach((s) => { s.status = 'EXPIRED'; s.ended_at = autoEndTime; });
    }

    const sessionId = `sess-${Date.now()}`;
    const sessionCode = `CODE-${Math.floor(1000 + Math.random() * 9000)}`;
    const sessionSecret = crypto.randomBytes(16).toString('hex');
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const deviceName = `Classroom BLE · ${targetSubjectId}-LAB3`;

    const sessionObj = {
      id: sessionId,
      session_code: sessionCode,
      teacher_id: resolvedTeacherId,
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
      slot_day: slotDay,
      slot_hour: slotHour != null ? Number(slotHour) : null,
    };


    if (isPg()) {
      await query(
        `INSERT INTO attendance_sessions (id, session_code, teacher_id, class_id, subject_id, room, device_name, session_secret, status, started_at, expires_at, slot_day, slot_hour) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);`,
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
          sessionObj.slot_day,
          sessionObj.slot_hour,
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

    if (session.status === 'ENDED' || session.status === 'closed') {
      return res.status(400).json({
        error: 'SESSION_ENDED',
        sessionId: session.id,
        status: 'ENDED',
        message: 'Attendance session has been ended by teacher',
        serverTime: serverTime.toISOString(),
      });
    }

    // EXPIRED sessions (auto-ended by teacher starting new one) still produce valid QR tokens
    // until the token window expires. Only block if session is explicitly ENDED.
    const payloadData = QrService.generatePayload(session.id, session.session_secret || session.sessionSecret || 'defaultSecret');

    res.json({
      sessionId: session.id,
      qrPayload: payloadData.qrPayload,
      issuedAt: payloadData.issuedAt,
      qrExpiresAt: payloadData.expiresAt,
      expiresAt: payloadData.expiresAt,
      sessionExpiresAt: session.expires_at || session.expiresAt,
      serverTime: serverTime.toISOString(),
      status: session.status === 'EXPIRED' ? 'ACTIVE' : session.status,
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
    console.log(`[END SESSION] Request to end session: ${sessionId} by user:`, req.user);

    if (isPg()) {
      // Step 1: End the target session — this MUST succeed
      const endResult = await query(
        `UPDATE attendance_sessions SET status = 'ENDED', ended_at = $2 WHERE id = $1 AND status NOT IN ('ENDED', 'CLOSED');`,
        [sessionId, now]
      );
      console.log(`[END SESSION] Target session ${sessionId}: rows affected = ${endResult.rowCount}`);

      if (endResult.rowCount === 0) {
        // Session may already be ended or doesn't exist — verify
        const check = await query(`SELECT id, status FROM attendance_sessions WHERE id = $1;`, [sessionId]);
        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: `Session ${sessionId} not found in database.` });
        }
        // Already ended — still return success with current state
        console.log(`[END SESSION] Session ${sessionId} already in status: ${check.rows[0].status}`);
      }

      // Step 2: Expire all other active sessions for this teacher (best-effort, don't fail if this errors)
      try {
        const teacherId = req.user.profileId || req.user.id;
        const expireResult = await query(
          `UPDATE attendance_sessions SET status = 'EXPIRED', ended_at = $2
           WHERE id != $1 AND status IN ('ACTIVE', 'open', 'OPEN')
           AND teacher_id IN (SELECT id FROM teachers WHERE id = $3 OR user_id = $3);`,
          [sessionId, now, teacherId]
        );
        console.log(`[END SESSION] Expired other sessions: rows affected = ${expireResult.rowCount}`);
      } catch (expireErr) {
        console.error(`[END SESSION] Failed to expire other sessions (non-fatal):`, expireErr.message);
      }
    } else {
      const s = memory.attendance_sessions.find((sess) => sess.id === sessionId);
      if (s) {
        s.status = 'ENDED';
        s.ended_at = now;
      }
      // Expire others in memory
      memory.attendance_sessions
        .filter((sess) => sess.id !== sessionId && ['ACTIVE', 'open', 'OPEN'].includes(sess.status))
        .forEach((sess) => { sess.status = 'EXPIRED'; sess.ended_at = now; });
    }

    // Fetch attendance summary for this session
    let presentStudents = [];
    let absentStudents = [];

    if (isPg()) {
      try {
        const presentRes = await query(
          `SELECT ar.student_id, u.name as student_name, s.roll_no, s.division
           FROM attendance_records ar
           JOIN students s ON ar.student_id = s.id
           JOIN users u ON s.user_id = u.id
           WHERE ar.session_id = $1 AND ar.status = 'present';`,
          [sessionId]
        );
        presentStudents = presentRes.rows;
      } catch (e) {
        console.error('[END SESSION] Failed to fetch present students:', e.message);
      }

      try {
        const absentRes = await query(
          `SELECT e.student_id, u.name as student_name, s.roll_no, s.division
           FROM enrollments e
           JOIN students s ON e.student_id = s.id
           JOIN users u ON s.user_id = u.id
           WHERE e.class_id = (SELECT class_id FROM attendance_sessions WHERE id = $1)
           AND e.student_id NOT IN (
             SELECT student_id FROM attendance_records WHERE session_id = $1
           );`,
          [sessionId]
        );
        absentStudents = absentRes.rows;
      } catch (e) {
        console.error('[END SESSION] Failed to fetch absent students:', e.message);
      }
    } else {
      const records = memory.attendance_records.filter((r) => r.session_id === sessionId && r.status === 'present');
      presentStudents = records.map((r) => ({ student_id: r.student_id }));

      const session = memory.attendance_sessions.find((s) => s.id === sessionId);
      if (session) {
        const enrolled = memory.enrollments.filter((e) => e.class_id === session.class_id);
        absentStudents = enrolled
          .filter((e) => !records.find((r) => r.student_id === e.student_id))
          .map((e) => ({ student_id: e.student_id }));
      }
    }

    console.log(`[END SESSION] Session ${sessionId} ended successfully. Present: ${presentStudents.length}, Absent: ${absentStudents.length}`);

    // Verify the DB actually updated
    if (isPg()) {
      const verify = await query(`SELECT status, ended_at FROM attendance_sessions WHERE id = $1;`, [sessionId]);
      if (verify.rows.length > 0) {
        console.log(`[END SESSION] VERIFICATION - Session ${sessionId} DB status: ${verify.rows[0].status}, ended_at: ${verify.rows[0].ended_at}`);
      }
    }

    res.json({
      success: true,
      sessionId,
      status: 'ENDED',
      endedAt: now,
      message: 'Attendance session ended',
      summary: {
        total: presentStudents.length + absentStudents.length,
        present: presentStudents.length,
        absent: absentStudents.length,
        presentStudents,
        absentStudents,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'SESSION_END_FAILED', message: err.message });
  }
});


// Step 9: POST /api/attendance/verify-qr
router.post('/verify-qr', authenticateToken, async (req, res) => {
  try {
    let { sessionId, token, qrToken } = req.body;
    let rawToken = token || qrToken;

    // Extract token if rawToken contains URL pattern
    if (rawToken && (rawToken.includes('token=') || rawToken.includes('session/'))) {
      if (rawToken.includes('token=')) {
        try {
          const parts = rawToken.split('token=');
          if (!sessionId && rawToken.includes('sessionId=')) {
            const urlParams = new URLSearchParams(rawToken.split('?')[1]);
            sessionId = urlParams.get('sessionId') || sessionId;
          }
          rawToken = parts[1].split('&')[0].trim();
        } catch (e) {}
      }
    }

    if (!sessionId || !rawToken) {
      return res.status(400).json({ success: false, status: 'INVALID_QR_FORMAT', message: 'Session ID or token missing from QR.' });
    }

    const memory = getMemoryDb();
    let session = null;
    let subjectName = 'DBMS';
    let className = 'CSE-A';

    if (isPg()) {
      const dbRes = await query(
        `SELECT s.*, sub.name as subject_name, sub.code as subject_code, c.division as class_division, c.name as class_name
         FROM attendance_sessions s
         LEFT JOIN subjects sub ON s.subject_id = sub.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1;`,
        [sessionId]
      );
      session = dbRes.rows[0];
    } else {
      session = memory.attendance_sessions.find((s) => s.id === sessionId);
    }

    if (!session) {
      return res.status(400).json({ success: false, status: 'SESSION_EXPIRED', message: 'Attendance session not found or expired.' });
    }

    subjectName = session.subject_name || session.subject_code || 'Database Management Systems';
    className = session.class_division || session.class_name || 'CSE-A';

    const serverTime = new Date();

    // 1. Session Status Check
    if (session.status === 'ENDED' || session.status === 'closed') {
      return res.status(400).json({ success: false, status: 'SESSION_CLOSED', message: 'Attendance session closed by teacher.' });
    }

    // 2. Dynamic QR Token Window Check
    console.log(`[VERIFY-QR] sessionId=${sessionId}, rawToken=${rawToken}, session_secret=${session.session_secret}`);
    const validation = QrService.validateToken(sessionId, session.session_secret || 'defaultSecret', rawToken);
    console.log(`[VERIFY-QR] validation result:`, JSON.stringify(validation));
    if (!validation.valid) {
      if (validation.reason === 'QR_EXPIRED_OR_INVALID') {
        return res.status(400).json({ success: false, status: 'QR_EXPIRED', message: 'QR code token expired for 30s window.' });
      }
      return res.status(400).json({ success: false, status: 'QR_INVALID', message: 'Scanned QR token is invalid for this session.' });
    }

    // 3. Resolve authenticated student
    let studentId = req.user.profileId || req.user.id;
    let studentClassDivision = null;
    let studentClassId = null;

    if (isPg()) {
      const stLookup = await query(
        `SELECT s.id, s.division, e.class_id
         FROM students s
         LEFT JOIN enrollments e ON e.student_id = s.id
         WHERE s.id = $1 OR s.user_id = $1 LIMIT 1;`,
        [studentId]
      );
      if (stLookup.rows.length > 0) {
        studentId = stLookup.rows[0].id;
        studentClassDivision = stLookup.rows[0].division;
        studentClassId = stLookup.rows[0].class_id;
      }
    } else {
      const stObj = memory.students.find((s) => s.id === studentId || s.user_id === req.user.id);
      if (stObj) {
        studentId = stObj.id;
        studentClassDivision = stObj.division;
      }
    }

    // 4. Class Division Mismatch Check (student.class_id == attendance_session.class_id)
    if (studentClassDivision && session.class_division && studentClassDivision !== session.class_division) {
      return res.status(403).json({
        success: false,
        status: 'NOT_YOUR_CLASS',
        message: `This session is for class ${session.class_division}. Your assigned class is ${studentClassDivision}.`,
        sessionClass: session.class_division,
        studentClass: studentClassDivision,
      });
    }

    // 5. Enrollment Check
    let isEnrolled = true;
    if (isPg()) {
      const enrRes = await query(
        `SELECT e.id FROM enrollments e 
         JOIN students s ON s.id = e.student_id 
         WHERE (s.id = $1 OR s.user_id = $1)
           AND (
             e.class_id = $2 OR 
             e.class_id IN (SELECT id FROM classes WHERE division = $2 OR code = $2 OR name ILIKE '%' || $2 || '%')
           );`,
        [studentId, session.class_id || className]
      );
      isEnrolled = enrRes.rows.length > 0 || !session.class_id;
    }

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        status: 'NOT_ENROLLED',
        message: 'You are not enrolled in this course or class.',
      });
    }

    // 6. Duplicate Attendance Check
    let alreadyMarked = false;
    if (isPg()) {
      const recRes = await query(
        `SELECT id FROM attendance_records WHERE (student_id = $1 OR student_id IN (SELECT id FROM students WHERE user_id = $1)) AND session_id = $2;`,
        [studentId, sessionId]
      );
      alreadyMarked = recRes.rows.length > 0;
    } else {
      alreadyMarked = memory.attendance_records.some(
        (r) => (r.student_id === studentId || r.studentId === studentId) && (r.session_id === sessionId || r.sessionId === sessionId)
      );
    }

    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        status: 'DUPLICATE',
        message: 'Attendance already completed for this session.',
      });
    }

    res.json({
      success: true,
      status: 'QR_VERIFIED',
      message: '✓ QR VERIFIED',
      class: className,
      subject: subjectName,
      nextStep: 'Registered Device Verification',
      session: {
        id: session.id,
        classId: session.class_id,
        subjectId: session.subject_id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, status: 'VERIFY_QR_FAILED', message: err.message });
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

// GET /api/attendance/active-sessions - Student discovers active sessions for their enrolled classes
router.get('/active-sessions', authenticateToken, async (req, res) => {
  try {
    const studentId = req.query.studentId || req.user.profileId || req.user.id;
    const memory = getMemoryDb();
    let sessions = [];

    if (isPg()) {
      // Find active sessions for classes the student is enrolled in
      const dbRes = await query(
        `SELECT 
           s.id, s.session_code, s.teacher_id, s.class_id, s.subject_id,
           s.room, s.device_name, s.status, s.started_at, s.expires_at,
           s.slot_day, s.slot_hour,
           sub.name as subject_name, sub.code as subject_code,
           c.name as class_name, c.division as class_division,
           u.name as teacher_name
         FROM attendance_sessions s
         JOIN subjects sub ON s.subject_id = sub.id
         JOIN classes c ON s.class_id = c.id
         JOIN teachers t ON s.teacher_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE s.status IN ('ACTIVE', 'open', 'OPEN')
           AND s.class_id IN (
             SELECT e.class_id FROM enrollments e
             JOIN students st ON e.student_id = st.id
             WHERE st.id = $1 OR st.user_id = $1
           )
         ORDER BY s.started_at DESC;`,
        [studentId]
      );
      sessions = dbRes.rows;
    } else {
      const student = memory.students.find((s) => s.id === studentId || s.user_id === studentId);
      if (student) {
        const enrolledClassIds = memory.enrollments
          .filter((e) => e.student_id === student.id)
          .map((e) => e.class_id);
        sessions = memory.attendance_sessions.filter(
          (s) => ['ACTIVE', 'open', 'OPEN'].includes(s.status) &&
            enrolledClassIds.includes(s.class_id)
        );
      }
    }

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_ACTIVE_SESSIONS_FAILED', message: err.message });
  }
});

// GET /api/attendance/student/:id/history - Attendance history with date/subject filtering
router.get('/student/:id/history', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { month, year, subjectId } = req.query;
    const memory = getMemoryDb();
    let records = [];

    if (isPg()) {
      let sql = `
        SELECT 
          ar.id, ar.student_id, ar.session_id, ar.subject_id, ar.timestamp, ar.status,
          ar.verification_attempt_id,
          sub.name as subject_name, sub.code as subject_code,
          s.class_id, s.room, s.started_at as session_started, s.expires_at as session_expires,
          c.division as class_division,
          u.name as teacher_name,
          aa.qr_status, aa.ble_status, aa.device_status, aa.liveness_status, aa.face_status, aa.final_status
        FROM attendance_records ar
        JOIN attendance_sessions s ON ar.session_id = s.id
        JOIN subjects sub ON ar.subject_id = sub.id
        JOIN classes c ON s.class_id = c.id
        JOIN teachers t ON s.teacher_id = t.id
        JOIN users u ON t.user_id = u.id
        LEFT JOIN attendance_attempts aa ON ar.verification_attempt_id = aa.id
        WHERE ar.student_id = $1`;
      const params = [studentId];
      let paramIdx = 2;

      if (month && year) {
        sql += ` AND EXTRACT(MONTH FROM ar.timestamp) = $${paramIdx} AND EXTRACT(YEAR FROM ar.timestamp) = $${paramIdx + 1}`;
        params.push(parseInt(month), parseInt(year));
        paramIdx += 2;
      } else if (year) {
        sql += ` AND EXTRACT(YEAR FROM ar.timestamp) = $${paramIdx}`;
        params.push(parseInt(year));
        paramIdx += 1;
      }

      if (subjectId) {
        sql += ` AND ar.subject_id = $${paramIdx}`;
        params.push(subjectId);
        paramIdx += 1;
      }

      sql += ` ORDER BY ar.timestamp DESC;`;
      const dbRes = await query(sql, params);
      records = dbRes.rows;
    } else {
      records = memory.attendance_records
        .filter((r) => r.student_id === studentId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    res.json({ studentId, records, count: records.length });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_HISTORY_FAILED', message: err.message });
  }
});

export default router;
