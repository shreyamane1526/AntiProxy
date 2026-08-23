import { QrService } from './qrService.js';
import { BleService } from './bleService.js';
import { FaceService } from './faceService.js';
import { query, isPg, getMemoryDb } from '../db/db.js';

export class AttendanceVerificationEngine {
  static async verifyAndRecord({
    studentId,
    sessionId,
    qrToken,
    deviceIdentifier,
    bleRssi,
    bleSupported = true,
    faceImageData,
  }) {
    const memory = getMemoryDb();

    // 1. Fetch Session details
    let session = null;
    if (isPg()) {
      const res = await query(`SELECT * FROM attendance_sessions WHERE id = $1;`, [sessionId]);
      session = res.rows[0];
    } else {
      session = memory.attendance_sessions.find((s) => s.id === sessionId);
    }

    if (!session) {
      return {
        success: false,
        finalStatus: 'SESSION_NOT_FOUND',
        failureReason: 'Attendance session does not exist',
      };
    }

    if (session.status !== 'open' || new Date() > new Date(session.expires_at)) {
      return {
        success: false,
        finalStatus: 'SESSION_EXPIRED',
        failureReason: 'Attendance session is closed or has expired',
      };
    }

    // 2. Check duplicate attendance
    let existingRecord = null;
    if (isPg()) {
      const res = await query(
        `SELECT * FROM attendance_records WHERE student_id = $1 AND session_id = $2;`,
        [studentId, sessionId]
      );
      existingRecord = res.rows[0];
    } else {
      existingRecord = memory.attendance_records.find(
        (r) => r.student_id === studentId && r.session_id === sessionId
      );
    }

    if (existingRecord) {
      return {
        success: false,
        finalStatus: 'DUPLICATE_ATTENDANCE',
        failureReason: 'Attendance already marked for this session',
      };
    }

    // 3. Check registered device
    let registeredDev = null;
    if (isPg()) {
      const res = await query(
        `SELECT * FROM registered_devices WHERE student_id = $1 AND status = 'active';`,
        [studentId]
      );
      registeredDev = res.rows[0];
    } else {
      registeredDev = memory.registered_devices.find(
        (d) => d.student_id === studentId && d.status === 'active'
      );
    }

    const deviceResult = registeredDev
      ? { status: 'DEVICE_VERIFIED', valid: true }
      : { status: 'DEVICE_UNREGISTERED', valid: false, reason: 'Student device is not registered' };

    // 4. Verify QR Token
    const qrResult = QrService.validateToken(sessionId, session.session_secret, qrToken);
    const qrStatus = qrResult.valid ? 'QR_VERIFIED' : 'QR_FAILED';

    // 5. Verify BLE Proximity
    const bleResult = BleService.verifyProximity({
      studentDeviceIdentifier: deviceIdentifier,
      sessionDeviceName: session.device_name,
      bleRssi,
      bleSupported,
    });

    // 6. Verify Face & Liveness
    const faceResult = FaceService.verifyFaceLiveness({ faceImageData });

    // Combine results
    const qrPassed = qrResult.valid;
    const devicePassed = deviceResult.valid;
    const blePassed = bleResult.verified || bleResult.status === 'BLE_UNSUPPORTED'; // Soft-allow unsupported BLE for web browser compatibility while flagging
    const facePassed = faceResult.verified;

    const allPassed = qrPassed && devicePassed && blePassed && facePassed;
    const finalStatus = allPassed ? 'ATTENDANCE_VERIFIED' : 'VERIFICATION_FAILED';
    
    let failureReason = null;
    if (!qrPassed) failureReason = qrResult.reason || 'Invalid or expired QR code';
    else if (!devicePassed) failureReason = deviceResult.reason || 'Device not registered';
    else if (!blePassed) failureReason = bleResult.message;
    else if (!facePassed) failureReason = faceResult.message;

    const attemptId = `att-attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const attemptRecord = {
      id: attemptId,
      student_id: studentId,
      session_id: sessionId,
      device_identifier: deviceIdentifier || 'web-client',
      qr_status: qrStatus,
      device_status: deviceResult.status,
      ble_status: bleResult.status,
      liveness_status: faceResult.livenessStatus || 'LIVENESS_FAILED',
      face_status: faceResult.matchStatus || 'FACE_FAILED',
      final_status: finalStatus,
      failure_reason: failureReason,
      created_at: new Date().toISOString(),
    };

    let recordId = null;

    if (allPassed) {
      recordId = `ar-${Date.now()}`;
      const record = {
        id: recordId,
        student_id: studentId,
        session_id: sessionId,
        subject_id: session.subject_id,
        timestamp: new Date().toISOString(),
        status: 'present',
        verification_attempt_id: attemptId,
      };

      if (isPg()) {
        await query(
          `INSERT INTO attendance_attempts (id, student_id, session_id, device_identifier, qr_status, device_status, ble_status, liveness_status, face_status, final_status, failure_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);`,
          [
            attemptRecord.id,
            attemptRecord.student_id,
            attemptRecord.session_id,
            attemptRecord.device_identifier,
            attemptRecord.qr_status,
            attemptRecord.device_status,
            attemptRecord.ble_status,
            attemptRecord.liveness_status,
            attemptRecord.face_status,
            attemptRecord.final_status,
            attemptRecord.failure_reason,
          ]
        );

        await query(
          `INSERT INTO attendance_records (id, student_id, session_id, subject_id, timestamp, status, verification_attempt_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (student_id, session_id) DO NOTHING;`,
          [record.id, record.student_id, record.session_id, record.subject_id, record.timestamp, record.status, record.verification_attempt_id]
        );
      } else {
        memory.attendance_attempts.push(attemptRecord);
        memory.attendance_records.push(record);
      }
    } else {
      if (isPg()) {
        await query(
          `INSERT INTO attendance_attempts (id, student_id, session_id, device_identifier, qr_status, device_status, ble_status, liveness_status, face_status, final_status, failure_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);`,
          [
            attemptRecord.id,
            attemptRecord.student_id,
            attemptRecord.session_id,
            attemptRecord.device_identifier,
            attemptRecord.qr_status,
            attemptRecord.device_status,
            attemptRecord.ble_status,
            attemptRecord.liveness_status,
            attemptRecord.face_status,
            attemptRecord.final_status,
            attemptRecord.failure_reason,
          ]
        );
      } else {
        memory.attendance_attempts.push(attemptRecord);
      }
    }

    return {
      success: allPassed,
      finalStatus,
      attemptId,
      recordId,
      details: {
        qr: qrStatus,
        device: deviceResult.status,
        ble: bleResult.status,
        liveness: faceResult.livenessStatus || 'FAILED',
        faceMatch: faceResult.matchStatus || 'FAILED',
      },
      failureReason,
    };
  }
}
