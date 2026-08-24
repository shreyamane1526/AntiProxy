import * as faceapi from "face-api.js"

let modelsLoaded = false
let modelLoadPromise = null

/**
 * Standard recommended distance threshold for face-api.js 128-d descriptors.
 * Distance <= 0.60 indicates the same person; > 0.60 indicates a different person.
 */
export const FACE_MATCH_THRESHOLD = 0.6

/**
 * Loads face-api.js models (Face Detection, 68 Landmarks, Face Recognition Net).
 * Lazy-loaded once and cached for all subsequent calls.
 */
export async function loadFaceApiModels(modelUri = "/models") {
  if (modelsLoaded) return true
  if (modelLoadPromise) return modelLoadPromise

  modelLoadPromise = (async () => {
    try {
      // Load SSD MobileNet V1, 68-point landmarks, and Face Recognition descriptor net
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUri),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
      ])
      modelsLoaded = true
      return true
    } catch (err) {
      console.warn("SSD Mobilenet model load failed, attempting tinyFaceDetector fallback:", err)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
      ])
      modelsLoaded = true
      return true
    }
  })().catch((err) => {
    modelLoadPromise = null
    console.error("Failed to load face-api.js recognition models:", err)
    throw err
  })

  return modelLoadPromise
}

/**
 * Generates a 128-dimensional biometric embedding from a live video frame, image, or canvas.
 * 
 * @param {HTMLVideoElement | HTMLCanvasElement | HTMLImageElement} input
 * @returns {Promise<number[] | null>} 128-length plain JS array of floats, or null if no face found
 */
export async function generateEmbedding(input) {
  if (!input) {
    console.warn("generateEmbedding: No input element provided.")
    return null
  }

  // Validate live video feed state
  if (input instanceof HTMLVideoElement) {
    if (input.readyState < 2 || input.videoWidth === 0 || input.videoHeight === 0) {
      console.warn("generateEmbedding: Video element is not ready or has 0 dimensions.")
      return null
    }
  }

  await loadFaceApiModels()

  let result = null

  // 1. Primary SSD MobileNet detector pipeline
  try {
    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      result = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
    }
  } catch (e) {
    console.warn("SSD detector error, trying fallback detector:", e)
  }

  // 2. Fallback to TinyFaceDetector if SSD was not loaded or failed
  if (!result && faceapi.nets.tinyFaceDetector.isLoaded) {
    try {
      result = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()
    } catch (tinyErr) {
      console.warn("Tiny detector error:", tinyErr)
    }
  }

  if (!result || !result.descriptor) {
    console.warn("generateEmbedding: No face detected in frame.")
    return null
  }

  // Convert Float32Array into a plain JS Array of floats (128-length) for JSON serialization
  const embedding = Array.from(result.descriptor)
  return embedding
}

/**
 * Computes Euclidean Distance between two 128-dimensional face embeddings.
 * 
 * Formula: sqrt( sum( (A_i - B_i)^2 ) )
 * 
 * @param {number[]} embeddingA
 * @param {number[]} embeddingB
 * @returns {number | null} Euclidean distance, or null if invalid inputs
 */
export function euclideanDistance(embeddingA, embeddingB) {
  if (!embeddingA || !embeddingB) return null
  if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) return null
  if (embeddingA.length === 0 || embeddingA.length !== embeddingB.length) return null

  let sumSquaredDiffs = 0
  for (let i = 0; i < embeddingA.length; i++) {
    const diff = embeddingA[i] - embeddingB[i]
    sumSquaredDiffs += diff * diff
  }

  const distance = Math.sqrt(sumSquaredDiffs)
  return Math.round(distance * 1000) / 1000
}
