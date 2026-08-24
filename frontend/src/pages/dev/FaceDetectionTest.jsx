import { useEffect, useRef, useState } from "react"
import {
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Activity,
  Fingerprint,
  RotateCcw,
  Sparkles,
  GitCompare,
  Copy,
  Check,
} from "lucide-react"
import CameraCapture from "../../components/CameraCapture"
import { detectFace, getFaceLandmarker } from "../../utils/faceDetection"
import { verifyLiveness, LIVENESS_THRESHOLDS } from "../../utils/livenessCheck"
import {
  generateEmbedding,
  loadFaceApiModels,
  euclideanDistance,
  FACE_MATCH_THRESHOLD,
} from "../../utils/faceEmbedding"

export default function FaceDetectionTest() {
  const videoRef = useRef(null)
  const [modelStatus, setModelStatus] = useState("loading")
  const [embeddingModelStatus, setEmbeddingModelStatus] = useState("loading")
  const [detection, setDetection] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(null)
  const [error, setError] = useState("")

  // Liveness check state machine
  // stages: "idle" | "capturing_a" | "prompting" | "capturing_b" | "evaluating" | "result"
  const [livenessStage, setLivenessStage] = useState("idle")
  const [livenessResult, setLivenessResult] = useState(null)
  const [countdown, setCountdown] = useState(1.5)
  const [threshold, setThreshold] = useState(LIVENESS_THRESHOLDS.TURN_HEAD_YAW_DELTA)

  // Biometric embedding states (last 2 generated embeddings in memory)
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false)
  const [currentEmbeddingData, setCurrentEmbeddingData] = useState(null)
  const [embeddingsHistory, setEmbeddingsHistory] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)

  // Preload models on mount (MediaPipe FaceLandmarker + face-api.js nets)
  useEffect(() => {
    let isMounted = true

    // 1. MediaPipe FaceLandmarker
    getFaceLandmarker()
      .then(() => {
        if (isMounted) setModelStatus("ready")
      })
      .catch((err) => {
        if (isMounted) {
          setModelStatus("error")
          setError(err?.message || "Failed to load MediaPipe face detection model.")
        }
      })

    // 2. face-api.js FaceRecognitionNet
    loadFaceApiModels()
      .then(() => {
        if (isMounted) setEmbeddingModelStatus("ready")
      })
      .catch((err) => {
        if (isMounted) {
          setEmbeddingModelStatus("error")
          console.error("Failed to load face-api.js models:", err)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Continuous 500ms face detection loop
  useEffect(() => {
    let isMounted = true
    let isProcessing = false

    const intervalId = setInterval(async () => {
      if (isProcessing) return
      // If we are actively running liveness or embedding generation, yield
      if (
        livenessStage === "capturing_a" ||
        livenessStage === "capturing_b" ||
        livenessStage === "evaluating" ||
        isGeneratingEmbedding
      ) {
        return
      }

      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return

      try {
        isProcessing = true
        const result = await detectFace(video)
        if (isMounted) {
          setDetection(result)
          setLastCheckTime(new Date().toLocaleTimeString())
        }
      } catch (err) {
        console.error("Frame detection error:", err)
      } finally {
        isProcessing = false
      }
    }, 500)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [livenessStage, isGeneratingEmbedding])

  // Active Liveness Test Runner
  const runLivenessTest = async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setError("Camera feed is not ready yet. Please wait for the video stream.")
      return
    }

    setError("")
    setLivenessResult(null)
    setLivenessStage("capturing_a")

    try {
      // Step 1: Capture Frame A (Neutral Reference)
      const frameA = await detectFace(video)
      if (!frameA.detected || !frameA.landmarks) {
        setLivenessStage("result")
        setLivenessResult({
          live: false,
          score: 0,
          threshold,
          reason: frameA.reason || "NO_FACE",
          details: { error: "No neutral face detected at start. Please look directly at the camera." },
        })
        return
      }

      setLivenessStage("prompting")
      setCountdown(1.5)

      // Step 2: Show prompt & countdown ~1.5s
      const durationMs = 1500
      const startTime = Date.now()

      await new Promise((resolve) => {
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, (durationMs - elapsed) / 1000)
          setCountdown(Math.round(remaining * 10) / 10)

          if (elapsed >= durationMs) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })

      // Step 3: Capture Frame B (Action Frame)
      setLivenessStage("capturing_b")
      const frameB = await detectFace(video)

      if (!frameB.detected || !frameB.landmarks) {
        setLivenessStage("result")
        setLivenessResult({
          live: false,
          score: 0,
          threshold,
          reason: frameB.reason || "NO_FACE",
          details: { error: "Face lost during head turn movement. Keep face inside frame." },
        })
        return
      }

      // Step 4: Evaluate Frame A vs Frame B Motion
      setLivenessStage("evaluating")
      const evaluation = verifyLiveness(frameA.landmarks, frameB.landmarks, "turn_head", threshold)

      setLivenessResult(evaluation)
      setLivenessStage("result")
    } catch (err) {
      console.error("Liveness verification error:", err)
      setError(err?.message || "An error occurred during liveness testing.")
      setLivenessStage("idle")
    }
  }

  const resetLiveness = () => {
    setLivenessStage("idle")
    setLivenessResult(null)
    setError("")
  }

  // Biometric Embedding Generation
  const handleGenerateEmbedding = async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setError("Camera feed is not ready yet.")
      return
    }

    setError("")
    setIsGeneratingEmbedding(true)

    try {
      const embedding = await generateEmbedding(video)

      if (!embedding) {
        setError("Could not generate face embedding. Please ensure your face is well-lit and clearly visible.")
        return
      }

      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        length: embedding.length,
        first5: embedding.slice(0, 5).map((v) => Math.round(v * 10000) / 10000),
        raw: embedding,
      }

      setCurrentEmbeddingData(newEntry)
      setEmbeddingsHistory((prev) => [newEntry, ...prev].slice(0, 2))
    } catch (err) {
      console.error("Embedding generation failed:", err)
      setError(err?.message || "Failed to generate face embedding descriptor.")
    } finally {
      setIsGeneratingEmbedding(false)
    }
  }

  const clearEmbeddingsHistory = () => {
    setEmbeddingsHistory([])
    setCurrentEmbeddingData(null)
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Compute Euclidean distance between last 2 embeddings in memory
  const pairwiseDistance =
    embeddingsHistory.length >= 2
      ? euclideanDistance(embeddingsHistory[0].raw, embeddingsHistory[1].raw)
      : null

  const isSamePersonMatch =
    pairwiseDistance !== null && pairwiseDistance <= FACE_MATCH_THRESHOLD

  // Derive detection status badge display
  const getStatusDisplay = () => {
    if (modelStatus === "loading" || embeddingModelStatus === "loading") {
      return {
        label: "Initializing models…",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        icon: RefreshCw,
        spin: true,
      }
    }
    if (modelStatus === "error" || embeddingModelStatus === "error") {
      return {
        label: "Model error",
        color: "text-red-500 bg-red-500/10 border-red-500/30",
        icon: AlertTriangle,
      }
    }
    if (!detection) {
      return {
        label: "Waiting for video…",
        color: "text-slate-400 bg-slate-500/10 border-slate-500/30",
        icon: RefreshCw,
        spin: true,
      }
    }
    if (detection.detected) {
      return {
        label: "Face detected",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
        icon: UserCheck,
      }
    }
    if (detection.reason === "MULTIPLE_FACES") {
      return {
        label: "Multiple faces",
        color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
        icon: Users,
      }
    }
    if (detection.reason === "LOW_CONFIDENCE") {
      return {
        label: "Low confidence",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        icon: AlertTriangle,
      }
    }
    return {
      label: "No face",
      color: "text-slate-400 bg-slate-500/10 border-slate-500/30",
      icon: UserX,
    }
  }

  const currentStatus = getStatusDisplay()
  const StatusIcon = currentStatus.icon

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal/20 text-teal border border-teal/40">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Biometric Verification Sandbox</h1>
              <p className="text-xs text-slate-400">Detection • Active Liveness • 128-D Face Embeddings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-800 text-teal border border-slate-700">
              Threshold: {FACE_MATCH_THRESHOLD} (Match)
            </span>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <CameraCapture
              facing="user"
              shape="square"
              videoRef={videoRef}
              captureLabel="Capture frame"
            />

            {/* In-camera Prompt Overlay for Active Liveness */}
            {livenessStage === "prompting" && (
              <div className="absolute inset-0 rounded-xl bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in border-2 border-teal">
                <div className="p-3 bg-teal/20 text-teal rounded-full mb-3 animate-bounce">
                  <ArrowLeftRight size={32} />
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-wider mb-1">Active Challenge</div>
                <div className="text-base font-extrabold text-teal mb-3 px-2">
                  "Turn your head slightly left, then back to center"
                </div>
                <div className="text-2xl font-mono font-black text-amber-400">{countdown.toFixed(1)}s</div>
              </div>
            )}

            {livenessStage === "capturing_a" && (
              <div className="absolute inset-0 rounded-xl bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                <RefreshCw size={28} className="animate-spin text-teal mb-2" />
                <span className="text-xs font-semibold text-white">Capturing Neutral Frame A…</span>
              </div>
            )}

            {livenessStage === "capturing_b" && (
              <div className="absolute inset-0 rounded-xl bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                <RefreshCw size={28} className="animate-spin text-teal mb-2" />
                <span className="text-xs font-semibold text-white">Capturing Action Frame B…</span>
              </div>
            )}

            {isGeneratingEmbedding && (
              <div className="absolute inset-0 rounded-xl bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                <RefreshCw size={28} className="animate-spin text-teal mb-2" />
                <span className="text-xs font-semibold text-white">Extracting 128-D Biometric Embedding…</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-xl border flex items-center justify-between ${currentStatus.color}`}>
            <div className="flex items-center gap-3">
              <StatusIcon size={22} className={currentStatus.spin ? "animate-spin" : ""} />
              <div>
                <div className="text-base font-bold">{currentStatus.label}</div>
                <div className="text-xs opacity-80">
                  {detection?.reason ? `Reason: ${detection.reason}` : "Live frame analysis"}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xl font-black">
                {detection?.confidence !== undefined ? `${Math.round(detection.confidence * 100)}%` : "—"}
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-70">Detection Confidence</div>
            </div>
          </div>
        </div>

        {/* Section: Action Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={runLivenessTest}
            disabled={modelStatus !== "ready" || !detection?.detected || livenessStage !== "idle"}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
              modelStatus === "ready" && detection?.detected && livenessStage === "idle"
                ? "bg-slate-800 hover:bg-slate-700 text-teal border border-teal/40 cursor-pointer shadow-teal/10"
                : "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800"
            }`}
          >
            <Activity size={18} />
            Test Active Liveness
          </button>

          <button
            type="button"
            onClick={handleGenerateEmbedding}
            disabled={embeddingModelStatus !== "ready" || isGeneratingEmbedding}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
              embeddingModelStatus === "ready" && !isGeneratingEmbedding
                ? "bg-teal hover:bg-teal-dark text-white cursor-pointer shadow-teal/20"
                : "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800"
            }`}
          >
            <Fingerprint size={18} />
            Generate Embedding
          </button>
        </div>

        {/* Section: Liveness Result Banner (if tested) */}
        {livenessStage === "result" && livenessResult && (
          <div
            className={`p-5 rounded-2xl border mb-6 transition-all ${
              livenessResult.live
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/40 text-rose-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {livenessResult.live ? (
                  <CheckCircle2 size={30} className="text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={30} className="text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-lg font-black tracking-tight">
                    {livenessResult.live ? "LIVE ✓" : "LIVENESS FAILED — no movement detected"}
                  </div>
                  <div className="text-xs opacity-90 font-medium mt-0.5">
                    {livenessResult.live
                      ? "Natural head turn motion verified via 3D facial yaw displacement"
                      : livenessResult.reason || "Insufficient landmark movement between frames"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={resetLiveness}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                title="Reset liveness test"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-current/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Measured Shift</span>
                <span className="text-sm font-bold text-white">{livenessResult.score}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Threshold</span>
                <span className="text-sm font-bold text-teal">{livenessResult.threshold}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Yaw Ratio (A)</span>
                <span className="text-sm font-bold text-white">{livenessResult.details?.yawA ?? "—"}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Yaw Ratio (B)</span>
                <span className="text-sm font-bold text-white">{livenessResult.details?.yawB ?? "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Biometric Embeddings Inspection & Pairwise Distance */}
        {embeddingsHistory.length > 0 && (
          <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-teal" />
                <h3 className="text-sm font-bold text-white">Biometric Descriptors (128-D Vector)</h3>
              </div>
              <button
                type="button"
                onClick={clearEmbeddingsHistory}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Pairwise Comparison Banner (when 2 embeddings captured) */}
            {embeddingsHistory.length >= 2 && pairwiseDistance !== null && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isSamePersonMatch
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <GitCompare size={24} className={isSamePersonMatch ? "text-emerald-400" : "text-rose-400"} />
                  <div>
                    <div className="text-sm font-bold">
                      {isSamePersonMatch ? "SAME PERSON MATCH ✓" : "DIFFERENT PERSON / NO MATCH"}
                    </div>
                    <div className="text-xs opacity-80">
                      Standard cutoff threshold: <span className="font-mono font-semibold">0.60</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono bg-slate-900/80 px-4 py-2 rounded-lg border border-current/20">
                  <span className="text-slate-400 text-[10px] block uppercase">Euclidean Distance</span>
                  <span className="text-lg font-black text-white">{pairwiseDistance.toFixed(3)}</span>
                  <span className="text-[10px] block opacity-70">
                    {isSamePersonMatch ? `(${pairwiseDistance} <= 0.60)` : `(${pairwiseDistance} > 0.60)`}
                  </span>
                </div>
              </div>
            )}

            {/* Embeddings List */}
            <div className="space-y-3">
              {embeddingsHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-teal flex items-center gap-1.5">
                      Sample #{embeddingsHistory.length - idx}
                      {idx === 0 && (
                        <span className="bg-teal/20 text-teal text-[10px] px-1.5 py-0.5 rounded font-normal">
                          Latest
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{item.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(item.raw), idx)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        title="Copy full 128-D vector to clipboard"
                      >
                        {copiedIndex === idx ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">Vector Length</span>
                      <span className="font-bold text-white">{item.length}</span>
                    </div>
                    <div className="col-span-1 sm:col-span-3 bg-slate-950 p-2 rounded border border-slate-800 text-left overflow-x-auto">
                      <span className="text-slate-500 block text-[9px] mb-0.5">First 5 Vector Components:</span>
                      <span className="text-teal font-mono">
                        [{item.first5.map((v) => (v >= 0 ? `+${v.toFixed(4)}` : v.toFixed(4))).join(", ")}
                        , …]
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/50 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
