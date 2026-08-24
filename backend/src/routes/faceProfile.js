import express from 'express';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/students/:studentId/face-profile
 * Registers or updates a student's 128-dimensional biometric face embedding.
 */
router.post('/:studentId/face-profile', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      embedding,
      modelName = 'face-api.js-faceRecognitionNet',
      modelVersion = '1.0',
      livenessVerified = false,
    } = req.body;

    // 1. Authorization: Only allow the authenticated student (or admin/authorized role) to register their profile
    const authProfileId = req.user.profileId || req.user.id;
    if (req.user.role === 'student' && authProfileId !== studentId && req.user.id !== studentId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You are only authorized to register a face profile for your own student account.',
      });
    }

    // 2. Validation: Embedding must be an array of exactly 128 finite numerical floats
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({
        error: 'INVALID_EMBEDDING',
        message: `Embedding must be an array of exactly 128 numerical values (received ${
          Array.isArray(embedding) ? embedding.length : typeof embedding
        }).`,
      });
    }

    const allValidNumbers = embedding.every(
      (v) => typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)
    );
    if (!allValidNumbers) {
      return res.status(400).json({
        error: 'INVALID_EMBEDDING',
        message: 'All 128 embedding components must be valid, finite numbers.',
      });
    }

    if (!modelName || typeof modelName !== 'string') {
      return res.status(400).json({
        error: 'INVALID_MODEL_NAME',
        message: 'modelName is required and must be a valid string.',
      });
    }

    const profileRecordId = `fp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isLiveness = Boolean(livenessVerified);
    const vectorString = `[${embedding.join(',')}]`;

    if (isPg()) {
      // Upsert into face_profiles table
      const upsertSql = `
        INSERT INTO face_profiles (
          id,
          student_id,
          embedding,
          model_name,
          model_version,
          liveness_verified,
          status,
          registered_at,
          updated_at
        ) VALUES (
          $1, $2, $3::vector, $4, $5, $6, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (student_id) DO UPDATE SET
          embedding = EXCLUDED.embedding,
          model_name = EXCLUDED.model_name,
          model_version = EXCLUDED.model_version,
          liveness_verified = EXCLUDED.liveness_verified,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, student_id, model_name, model_version, liveness_verified, status, registered_at, updated_at;
      `;

      const result = await query(upsertSql, [
        profileRecordId,
        studentId,
        vectorString,
        modelName,
        modelVersion,
        isLiveness,
      ]);

      const saved = result.rows[0];

      return res.json({
        success: true,
        message: 'Face profile successfully registered',
        profile: {
          id: saved.id,
          studentId: saved.student_id,
          modelName: saved.model_name,
          modelVersion: saved.model_version,
          livenessVerified: saved.liveness_verified,
          status: saved.status,
          registeredAt: saved.registered_at,
          updatedAt: saved.updated_at,
        },
      });
    } else {
      // In-memory fallback
      const memory = getMemoryDb();
      memory.face_profiles = memory.face_profiles || [];

      const existingIndex = memory.face_profiles.findIndex((f) => f.student_id === studentId);
      const nowIso = new Date().toISOString();

      const profileData = {
        id: existingIndex >= 0 ? memory.face_profiles[existingIndex].id : profileRecordId,
        student_id: studentId,
        embedding: [...embedding],
        model_name: modelName,
        model_version: modelVersion,
        liveness_verified: isLiveness,
        status: 'active',
        registered_at: existingIndex >= 0 ? memory.face_profiles[existingIndex].registered_at : nowIso,
        updated_at: nowIso,
      };

      if (existingIndex >= 0) {
        memory.face_profiles[existingIndex] = profileData;
      } else {
        memory.face_profiles.push(profileData);
      }

      return res.json({
        success: true,
        message: 'Face profile successfully registered (in-memory store)',
        profile: {
          id: profileData.id,
          studentId: profileData.student_id,
          modelName: profileData.model_name,
          modelVersion: profileData.model_version,
          livenessVerified: profileData.liveness_verified,
          status: profileData.status,
          registeredAt: profileData.registered_at,
          updatedAt: profileData.updated_at,
        },
      });
    }
  } catch (err) {
    console.error('Face profile registration error:', err);
    res.status(500).json({ error: 'FACE_PROFILE_REGISTRATION_FAILED', message: err.message });
  }
});

/**
 * GET /api/students/:studentId/face-profile
 * Checks if a face profile is registered for the specified student.
 * Never returns the raw biometric embedding vector.
 */
router.get('/:studentId/face-profile', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (isPg()) {
      const sql = `
        SELECT id, student_id, model_name, model_version, liveness_verified, status, registered_at, updated_at
        FROM face_profiles
        WHERE student_id = $1 AND status = 'active'
        LIMIT 1;
      `;
      const result = await query(sql, [studentId]);

      if (result.rows.length === 0) {
        return res.json({ registered: false });
      }

      const row = result.rows[0];
      return res.json({
        registered: true,
        registeredAt: row.registered_at,
        modelName: row.model_name,
        modelVersion: row.model_version,
        livenessVerified: row.liveness_verified,
        status: row.status,
      });
    } else {
      const memory = getMemoryDb();
      const profiles = memory.face_profiles || [];
      const found = profiles.find((p) => p.student_id === studentId && p.status === 'active');

      if (!found) {
        return res.json({ registered: false });
      }

      return res.json({
        registered: true,
        registeredAt: found.registered_at,
        modelName: found.model_name,
        modelVersion: found.model_version,
        livenessVerified: found.liveness_verified,
        status: found.status,
      });
    }
  } catch (err) {
    console.error('Fetch face profile error:', err);
    res.status(500).json({ error: 'FETCH_FACE_PROFILE_FAILED', message: err.message });
  }
});

export default router;
