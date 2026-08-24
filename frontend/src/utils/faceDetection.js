import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

let landmarkerPromise = null
let faceLandmarker = null

/**
 * Initializes and caches the MediaPipe FaceLandmarker instance.
 * Lazy-loaded once and reused across all subsequent detectFace calls.
 */
export async function getFaceLandmarker() {
  if (faceLandmarker) {
    return faceLandmarker
  }

  if (landmarkerPromise) {
    return landmarkerPromise
  }

  landmarkerPromise = (async () => {
    // Attempt local wasm assets first, falling back to CDN if needed
    let vision
    try {
      vision = await FilesetResolver.forVisionTasks("/wasm")
    } catch {
      vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      )
    }

    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 5,
        minFaceDetectionConfidence: 0.1,
        minFacePresenceConfidence: 0.1,
        minTrackingConfidence: 0.1,
        outputFaceBlendshapes: true,
      })
    } catch (gpuErr) {
      console.warn("GPU delegate unavailable for FaceLandmarker, falling back to CPU:", gpuErr)
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 5,
        minFaceDetectionConfidence: 0.1,
        minFacePresenceConfidence: 0.1,
        minTrackingConfidence: 0.1,
        outputFaceBlendshapes: true,
      })
    }

    return faceLandmarker
  })().catch((err) => {
    landmarkerPromise = null
    console.error("Failed to initialize FaceLandmarker:", err)
    throw err
  })

  return landmarkerPromise
}

/**
 * Runs face detection on a single video frame (or canvas/image element).
 * @param {HTMLVideoElement | HTMLCanvasElement | HTMLImageElement} videoElement
 * @returns {Promise<{
 *   detected: boolean,
 *   faceCount?: number,
 *   boundingBox?: {
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number,
 *     normalized: { originX: number, originY: number, width: number, height: number }
 *   },
 *   confidence?: number,
 *   landmarks?: Array<{ x: number, y: number, z: number }>,
 *   reason?: "NO_FACE" | "MULTIPLE_FACES" | "LOW_CONFIDENCE"
 * }>}
 */
export async function detectFace(videoElement) {
  if (!videoElement) {
    return { detected: false, reason: "NO_FACE" }
  }

  // Ensure video element is playing and has non-zero frame dimensions
  if (videoElement instanceof HTMLVideoElement) {
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return { detected: false, reason: "NO_FACE" }
    }
  }

  const landmarker = await getFaceLandmarker()
  const result = landmarker.detect(videoElement)

  const faces = result?.faceLandmarks || []
  const faceCount = faces.length

  if (faceCount === 0) {
    return {
      detected: false,
      faceCount: 0,
      reason: "NO_FACE",
    }
  }

  if (faceCount > 1) {
    return {
      detected: false,
      faceCount,
      reason: "MULTIPLE_FACES",
    }
  }

  // Exactly one face detected
  const landmarks = faces[0]
  const width = videoElement.videoWidth || videoElement.width || 640
  const height = videoElement.videoHeight || videoElement.height || 480

  let minX = 1
  let maxX = 0
  let minY = 1
  let maxY = 0

  for (const point of landmarks) {
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  }

  // Clamp normalized bounds
  minX = Math.max(0, minX)
  maxX = Math.min(1, maxX)
  minY = Math.max(0, minY)
  maxY = Math.min(1, maxY)

  const boxWidthNorm = Math.max(0, maxX - minX)
  const boxHeightNorm = Math.max(0, maxY - minY)

  const boundingBox = {
    x: Math.round(minX * width),
    y: Math.round(minY * height),
    width: Math.round(boxWidthNorm * width),
    height: Math.round(boxHeightNorm * height),
    normalized: {
      originX: minX,
      originY: minY,
      width: boxWidthNorm,
      height: boxHeightNorm,
    },
  }

  // Calculate confidence
  let confidence = 0.95
  if (typeof landmarks[0]?.presence === "number") {
    confidence = landmarks[0].presence
  } else if (result.faceBlendshapes?.[0]?.categories?.length) {
    const scores = result.faceBlendshapes[0].categories.map((c) => c.score)
    const maxScore = Math.max(...scores)
    confidence = Math.min(0.99, Math.max(0.7, 0.8 + maxScore * 0.2))
  }

  // Degrade confidence if bounding box is uncharacteristically small
  if (boxWidthNorm < 0.05 || boxHeightNorm < 0.05) {
    confidence = Math.min(confidence, 0.4)
  }

  confidence = Math.round(confidence * 100) / 100

  if (confidence < 0.5) {
    return {
      detected: false,
      faceCount: 1,
      confidence,
      reason: "LOW_CONFIDENCE",
    }
  }

  return {
    detected: true,
    faceCount: 1,
    boundingBox,
    confidence,
    landmarks,
  }
}

export { verifyLiveness, computeYawRatio, computeEyeAspectRatio, LIVENESS_THRESHOLDS } from "./livenessCheck"
