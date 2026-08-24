/**
 * AntiProxy Active Liveness Verification Engine
 * 
 * Verifies active physical presence via 3D facial landmark motion analysis
 * between two sequential frames (Frame A = neutral reference, Frame B = challenged motion).
 * Eliminates static spoofing (printed photos, digital screens, replay attacks).
 */

export const LANDMARK_INDEXES = {
  NOSE_TIP: 1,
  NOSE_BASE: 4,
  LEFT_CHEEK_EDGE: 234,
  RIGHT_CHEEK_EDGE: 454,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
}

export const LIVENESS_THRESHOLDS = {
  // Head turn yaw ratio threshold: 0.06 (6% relative displacement across the face span)
  // Static pictures/hand jitter produce < 0.025; natural head turns produce 0.07 - 0.20+
  TURN_HEAD_YAW_DELTA: 0.06,
  
  // Eye Aspect Ratio (EAR) dip threshold for blinks (0.08 delta between open and closed)
  BLINK_EAR_DELTA: 0.08,
}

/**
 * Calculates 2D Euclidean distance between two landmarks
 */
function euclideanDistance(p1, p2) {
  if (!p1 || !p2) return 0
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Computes the normalized horizontal yaw ratio of the nose tip relative to the face width.
 * Ratio is ~0.50 when facing center, < 0.40 when turned one direction, > 0.60 when turned the other.
 * 
 * @param {Array<{x: number, y: number, z: number}>} landmarks 
 * @returns {number|null}
 */
export function computeYawRatio(landmarks) {
  if (!landmarks || landmarks.length < 455) return null
  const nose = landmarks[LANDMARK_INDEXES.NOSE_TIP]
  const leftEdge = landmarks[LANDMARK_INDEXES.LEFT_CHEEK_EDGE]
  const rightEdge = landmarks[LANDMARK_INDEXES.RIGHT_CHEEK_EDGE]

  if (!nose || !leftEdge || !rightEdge) return null

  const faceWidth = Math.abs(rightEdge.x - leftEdge.x)
  if (faceWidth === 0) return 0.5

  const minX = Math.min(leftEdge.x, rightEdge.x)
  return (nose.x - minX) / faceWidth
}

/**
 * Computes Eye Aspect Ratio (EAR) for blink detection
 * (Note: Primary challenge is "turn_head"; "blink" can be toggled similarly).
 * 
 * @param {Array<{x: number, y: number, z: number}>} landmarks 
 * @returns {number|null}
 */
export function computeEyeAspectRatio(landmarks) {
  if (!landmarks || landmarks.length < 387) return null

  const leftV = euclideanDistance(
    landmarks[LANDMARK_INDEXES.LEFT_EYE_TOP],
    landmarks[LANDMARK_INDEXES.LEFT_EYE_BOTTOM]
  )
  const leftH = euclideanDistance(
    landmarks[LANDMARK_INDEXES.LEFT_EYE_OUTER],
    landmarks[LANDMARK_INDEXES.LEFT_EYE_INNER]
  )
  const leftEAR = leftH > 0 ? leftV / leftH : 0

  const rightV = euclideanDistance(
    landmarks[LANDMARK_INDEXES.RIGHT_EYE_TOP],
    landmarks[LANDMARK_INDEXES.RIGHT_EYE_BOTTOM]
  )
  const rightH = euclideanDistance(
    landmarks[LANDMARK_INDEXES.RIGHT_EYE_OUTER],
    landmarks[LANDMARK_INDEXES.RIGHT_EYE_INNER]
  )
  const rightEAR = rightH > 0 ? rightV / rightH : 0

  return (leftEAR + rightEAR) / 2
}

/**
 * Evaluates active liveness by comparing landmark movements across two sequential frames.
 * 
 * @param {Array<{x,y,z}>|{landmarks: Array<{x,y,z}>}} resultA Frame A (neutral/start reference)
 * @param {Array<{x,y,z}>|{landmarks: Array<{x,y,z}>}} resultB Frame B (action frame)
 * @param {"turn_head"|"blink"} [challengeType="turn_head"] Challenge type to evaluate
 * @param {number} [customThreshold] Optional custom threshold override
 * @returns {{
 *   live: boolean,
 *   challengeType: string,
 *   score: number,
 *   threshold: number,
 *   reason?: "NO_MOVEMENT_DETECTED" | "MISSING_LANDMARKS" | "INVALID_CHALLENGE_TYPE",
 *   details: object
 * }}
 */
export function verifyLiveness(resultA, resultB, challengeType = "turn_head", customThreshold) {
  const landmarksA = Array.isArray(resultA) ? resultA : resultA?.landmarks
  const landmarksB = Array.isArray(resultB) ? resultB : resultB?.landmarks

  if (!landmarksA || !landmarksB || landmarksA.length === 0 || landmarksB.length === 0) {
    return {
      live: false,
      challengeType,
      score: 0,
      threshold: customThreshold ?? 0,
      reason: "MISSING_LANDMARKS",
      details: { error: "Missing landmarks on one or both captured frames" },
    }
  }

  // 1. Head Turn Challenge (Primary Implementation)
  if (challengeType === "turn_head") {
    const threshold = customThreshold !== undefined 
      ? customThreshold 
      : LIVENESS_THRESHOLDS.TURN_HEAD_YAW_DELTA

    const yawA = computeYawRatio(landmarksA)
    const yawB = computeYawRatio(landmarksB)

    if (yawA === null || yawB === null) {
      return {
        live: false,
        challengeType: "turn_head",
        score: 0,
        threshold,
        reason: "MISSING_LANDMARKS",
        details: { error: "Could not compute yaw ratio from landmark mesh" },
      }
    }

    const noseA = landmarksA[LANDMARK_INDEXES.NOSE_TIP]
    const noseB = landmarksB[LANDMARK_INDEXES.NOSE_TIP]
    const leftA = landmarksA[LANDMARK_INDEXES.LEFT_CHEEK_EDGE]
    const rightA = landmarksA[LANDMARK_INDEXES.RIGHT_CHEEK_EDGE]
    const faceWidth = Math.abs(rightA.x - leftA.x) || 1

    const rawNoseShift = Math.abs(noseB.x - noseA.x)
    const normalizedNoseShift = rawNoseShift / faceWidth
    const yawShift = Math.abs(yawB - yawA)

    // The shift score is the yaw ratio displacement
    const score = Math.round(yawShift * 1000) / 1000
    const isLive = score >= threshold

    return {
      live: isLive,
      challengeType: "turn_head",
      score,
      threshold,
      reason: isLive ? undefined : "NO_MOVEMENT_DETECTED",
      details: {
        yawA: Math.round(yawA * 1000) / 1000,
        yawB: Math.round(yawB * 1000) / 1000,
        yawShift: score,
        rawNoseShift: Math.round(rawNoseShift * 1000) / 1000,
        normalizedNoseShift: Math.round(normalizedNoseShift * 1000) / 1000,
      },
    }
  }

  // 2. Blink Challenge (Alternative Challenge Type)
  if (challengeType === "blink") {
    const threshold = customThreshold !== undefined 
      ? customThreshold 
      : LIVENESS_THRESHOLDS.BLINK_EAR_DELTA

    const earA = computeEyeAspectRatio(landmarksA)
    const earB = computeEyeAspectRatio(landmarksB)

    if (earA === null || earB === null) {
      return {
        live: false,
        challengeType: "blink",
        score: 0,
        threshold,
        reason: "MISSING_LANDMARKS",
        details: { error: "Could not compute Eye Aspect Ratio" },
      }
    }

    const earDelta = Math.abs(earB - earA)
    const score = Math.round(earDelta * 1000) / 1000
    const isLive = score >= threshold

    return {
      live: isLive,
      challengeType: "blink",
      score,
      threshold,
      reason: isLive ? undefined : "NO_MOVEMENT_DETECTED",
      details: {
        earA: Math.round(earA * 1000) / 1000,
        earB: Math.round(earB * 1000) / 1000,
        earDelta: score,
      },
    }
  }

  return {
    live: false,
    challengeType,
    score: 0,
    threshold: 0,
    reason: "INVALID_CHALLENGE_TYPE",
    details: {},
  }
}
