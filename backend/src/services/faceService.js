import { query, isPg, getMemoryDb } from '../db/db.js';

/**
 * Face Liveness & Identity Matching Service
 * Uses pgvector's Euclidean distance operator (<->) to match live face descriptors
 * with enrolled student biometric face profiles.
 */
export class FaceService {
  /**
   * Verifies live facial capture and matches against student registered profile.
   * 
   * @param {Object} params
   * @param {string} params.studentId - Target student ID
   * @param {number[]} params.liveEmbedding - 128-length array of float components
   * @param {boolean} params.livenessVerified - Whether active head-turn liveness passed
   * @returns {Promise<{
   *   status: string,
   *   verified: boolean,
   *   livenessStatus?: string,
   *   matchStatus?: string,
   *   confidence?: number,
   *   distance?: number,
   *   message: string
   * }>}
   */
  static async verifyFaceLiveness({ studentId, liveEmbedding, livenessVerified }) {
    // 1. Validate live biometric descriptor
    if (
      !liveEmbedding ||
      !Array.isArray(liveEmbedding) ||
      liveEmbedding.length !== 128 ||
      !liveEmbedding.every((v) => typeof v === 'number' && Number.isFinite(v))
    ) {
      return {
        status: 'NO_FACE_DETECTED',
        verified: false,
        livenessStatus: 'LIVENESS_FAILED',
        matchStatus: 'FACE_FAILED',
        confidence: 0,
        message: 'No face detected or invalid biometric embedding provided.',
      };
    }

    // 2. Validate active liveness challenge
    if (!livenessVerified) {
      return {
        status: 'LIVENESS_FAILED',
        verified: false,
        livenessStatus: 'LIVENESS_FAILED',
        matchStatus: 'FACE_FAILED',
        confidence: 0,
        message: 'Active face liveness check failed. Please ensure natural movement.',
      };
    }

    // 3. Query student's registered face profile from database
    const memory = getMemoryDb();
    let distance = null;
    let profileFound = false;

    if (isPg()) {
      // Execute pgvector Euclidean distance calculation (<->) directly in SQL
      const vectorString = `[${liveEmbedding.join(',')}]`;
      const sql = `
        SELECT (embedding <-> $1::vector) AS distance, id, model_name, status
        FROM face_profiles
        WHERE student_id = $2 AND status = 'active'
        LIMIT 1;
      `;

      const res = await query(sql, [vectorString, studentId]);

      if (res.rows.length > 0) {
        profileFound = true;
        distance = parseFloat(res.rows[0].distance);
      }
    } else {
      // In-memory fallback calculation
      const profiles = memory.face_profiles || [];
      const profile = profiles.find((p) => p.student_id === studentId && p.status === 'active');

      if (profile && profile.embedding && profile.embedding.length === 128) {
        profileFound = true;
        let sumSq = 0;
        for (let i = 0; i < 128; i++) {
          const diff = liveEmbedding[i] - profile.embedding[i];
          sumSq += diff * diff;
        }
        distance = Math.sqrt(sumSq);
      }
    }

    if (!profileFound) {
      return {
        status: 'FACE_NOT_REGISTERED',
        verified: false,
        livenessStatus: 'LIVENESS_PASSED',
        matchStatus: 'PROFILE_NOT_FOUND',
        confidence: 0,
        message: 'No registered face profile found. Please register your face first.',
      };
    }

    // 4. Decision boundary: Distance < 0.60 denotes verified identity
    const MATCH_THRESHOLD = 0.6;
    const isMatch = distance < MATCH_THRESHOLD;

    // Confidence formula: 1.0 at distance 0, ~0.85 at 0.35, ~0.70 at 0.60
    const confidence = Math.max(
      0,
      Math.min(1, Math.round((1 - distance / 1.2) * 100) / 100)
    );

    if (isMatch) {
      return {
        status: 'FACE_VERIFIED',
        verified: true,
        livenessStatus: 'LIVENESS_PASSED',
        matchStatus: 'FACE_MATCHED',
        distance: Math.round(distance * 1000) / 1000,
        confidence,
        message: 'Liveness passed and identity verified against student registered face profile.',
      };
    } else {
      return {
        status: 'FACE_NO_MATCH',
        verified: false,
        livenessStatus: 'LIVENESS_PASSED',
        matchStatus: 'FACE_MISMATCH',
        distance: Math.round(distance * 1000) / 1000,
        confidence,
        message: 'Face does not match registered identity.',
      };
    }
  }
}
