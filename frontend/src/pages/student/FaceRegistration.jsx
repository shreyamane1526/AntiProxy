import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowLeftRight,
  Fingerprint,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  Camera,
  Shield,
} from "lucide-react"
import PageHeader from "../../components/PageHeader"
import CameraCapture from "../../components/CameraCapture"
import NotificationMenu from "../../components/NotificationMenu"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"
import { detectFace, getFaceLandmarker } from "../../utils/faceDetection"
import { verifyLiveness } from "../../utils/livenessCheck"
import { generateEmbedding, loadFaceApiModels } from "../../utils/faceEmbedding"

export default function FaceRegistration() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const studentId = profile?.id || user?.profileId || user?.id

  const videoRef = useRef(null)

  // Registration flow steps:
  // "loading_status" | "intro" | "detecting" | "liveness" | "generating" | "submitting" | "success" | "error"
  const [step, setStep] = useState("loading_status")
  const [existingProfile, setExistingProfile] = useState(null)

  // Model load states
  const [modelsReady, setModelsReady] = useState(false)
  const [modelError, setModelError] = useState("")

  // Live detection telemetry
  const [detection, setDetection] = useState(null)
  const [steadyCounter, setSteadyCounter] = useState(0)

  // Liveness challenge state
  const [livenessStage, setLivenessStage] = useState("ready") // "ready" | "capturing_a" | "prompting" | "capturing_b"
  const [countdown, setCountdown] = useState(1.5)
  const [livenessScore, setLivenessScore] = useState(null)

  // Error handling
  const [errorMessage, setErrorMessage] = useState("")
  const [errorStep, setErrorStep] = useState("")

  // Preload models and check existing profile on mount
  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        // 1. Fetch current status
        if (studentId) {
          try {
            const statusRes = await api.faceProfile.status(studentId)
            if (isMounted && statusRes && statusRes.registered) {
              setExistingProfile(statusRes)
            }
          } catch (err) {
            console.warn("Could not fetch existing face profile status:", err.message)
          }
        }

        // 2. Preload both models
        await Promise.all([getFaceLandmarker(), loadFaceApiModels()])
        if (isMounted) {
          setModelsReady(true)
          setStep("intro")
        }
      } catch (err) {
        console.error("Initialization error:", err)
        if (isMounted) {
          setModelError(err.message || "Failed to load biometric models.")
          setStep("intro")
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [studentId])

  // Continuous face detection loop when in "detecting" step
  useEffect(() => {
    if (step !== "detecting") return

    let isMounted = true
    let isProcessing = false

    const interval = setInterval(async () => {
      if (isProcessing) return
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return

      try {
        isProcessing = true
        const result = await detectFace(video)
        if (!isMounted) return

        setDetection(result)

        if (result.detected && result.confidence >= 0.7) {
          setSteadyCounter((prev) => {
            const next = prev + 1
            if (next >= 3) {
              // 3 consecutive good frames -> advance to liveness step
              setStep("liveness")
              return 0
            }
            return next
          })
        } else {
          setSteadyCounter(0)
        }
      } catch (err) {
        console.error("Face detection loop error:", err)
      } finally {
        isProcessing = false
      }
    }, 400)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [step])

  // Start registration sequence
  const startRegistration = () => {
    setErrorMessage("")
    setErrorStep("")
    setSteadyCounter(0)
    setDetection(null)
    setStep("detecting")
  }

  // Execute Liveness Challenge and Embedding Pipeline
  const executeLivenessAndEmbedding = async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      handleFailure("liveness", "Camera video feed is not available.")
      return
    }

    try {
      // Step A: Capture Neutral Frame A
      setLivenessStage("capturing_a")
      const frameA = await detectFace(video)
      if (!frameA.detected || !frameA.landmarks) {
        handleFailure("liveness", "No neutral face detected. Please face the camera directly.")
        return
      }

      // Step B: Prompt user to turn head
      setLivenessStage("prompting")
      setCountdown(1.5)

      const durationMs = 1500
      const startTime = Date.now()

      await new Promise((resolve) => {
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const rem = Math.max(0, (durationMs - elapsed) / 1000)
          setCountdown(Math.round(rem * 10) / 10)

          if (elapsed >= durationMs) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })

      // Step C: Capture Action Frame B
      setLivenessStage("capturing_b")
      const frameB = await detectFace(video)
      if (!frameB.detected || !frameB.landmarks) {
        handleFailure("liveness", "Face lost during movement. Please keep face inside frame.")
        return
      }

      // Step D: Verify Liveness
      const livenessEval = verifyLiveness(frameA.landmarks, frameB.landmarks, "turn_head")
      setLivenessScore(livenessEval.score)

      if (!livenessEval.live) {
        handleFailure(
          "liveness",
          `Active liveness check failed (shift: ${livenessEval.score}, required: ${livenessEval.threshold}). Please turn your head clearly when prompted.`
        )
        return
      }

      // Step E: Capture frame snapshot onto in-memory canvas before any DOM unmount
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      setStep("generating")

      // Extract 128-D biometric descriptor from canvas snapshot
      let embedding = null
      try {
        embedding = await generateEmbedding(canvas)
      } catch (embErr) {
        console.warn("Canvas embedding failed, trying video element fallback:", embErr)
        embedding = await generateEmbedding(video)
      }

      if (!embedding || embedding.length !== 128) {
        handleFailure("embedding", "Failed to extract 128-D biometric descriptor. Please ensure adequate lighting.")
        return
      }

      // Step F: Securely Submit to Backend
      setStep("submitting")
      const payload = {
        embedding,
        modelName: "face-api.js-faceRecognitionNet",
        modelVersion: "1.0",
        livenessVerified: true,
      }

      const response = await api.faceProfile.register(studentId, payload)

      if (response && response.success) {
        toast.success("Face profile successfully registered!")
        setStep("success")
        setExistingProfile(response.profile)
      } else {
        handleFailure("api", response?.message || "Failed to save face profile.")
      }
    } catch (err) {
      console.error("Registration pipeline failed:", err)
      handleFailure("api", err?.data?.message || err.message || "Network or server error during registration.")
    }
  }

  const handleFailure = (failedStep, message) => {
    setErrorStep(failedStep)
    setErrorMessage(message)
    setStep("error")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Face Profile Registration"
        subtitle="Register your biometric identity profile for multi-factor attendance verification."
        action={<NotificationMenu />}
      />

      {/* Step 0: Initial Loading Status */}
      {step === "loading_status" && (
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
          <RefreshCw className="animate-spin text-teal mx-auto mb-4" size={32} />
          <h3 className="text-base font-bold text-navy dark:text-white">Loading Biometric Engine</h3>
          <p className="text-xs text-muted mt-1">Initializing MediaPipe & face recognition models…</p>
        </div>
      )}

      {/* Step 1: Overview & Intro Screen */}
      {step === "intro" && (
        <div className="space-y-6">
          {/* Existing Profile Notification (if already registered) */}
          {existingProfile?.registered && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Active Face Profile Registered
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Your biometric identity descriptor is active. Registered on:{" "}
                  <span className="font-semibold">
                    {new Date(existingProfile.registeredAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Registration Guide Cards */}
          <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2.5 rounded-xl bg-teal/10 text-teal border border-teal/20">
                <Fingerprint size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy dark:text-white">3-Step Registration Pipeline</h2>
                <p className="text-xs text-muted">A quick 15-second biometric enrolment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border">
                <div className="h-8 w-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="font-bold text-sm text-navy dark:text-white mb-1">Face Alignment</h3>
                <p className="text-xs text-muted">
                  Position your face clearly within the circular camera frame under good lighting.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border">
                <div className="h-8 w-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="font-bold text-sm text-navy dark:text-white mb-1">Liveness Challenge</h3>
                <p className="text-xs text-muted">
                  Turn your head slightly when prompted to confirm physical presence and prevent spoofing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border">
                <div className="h-8 w-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="font-bold text-sm text-navy dark:text-white mb-1">128-D Encryption</h3>
                <p className="text-xs text-muted">
                  Your encrypted biometric vector is securely enrolled directly into your student account.
                </p>
              </div>
            </div>

            {modelError && (
              <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{modelError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={startRegistration}
                disabled={!modelsReady}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                  modelsReady
                    ? "bg-teal hover:bg-teal-dark text-white cursor-pointer"
                    : "bg-slate-200 dark:bg-slate-800 text-muted cursor-not-allowed"
                }`}
              >
                <Camera size={18} />
                {existingProfile?.registered ? "Update Face Profile" : "Start Face Registration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Camera Face Alignment */}
      {step === "detecting" && (
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-lg font-bold text-navy dark:text-white">Step 1: Align Your Face</h2>
            <p className="text-xs text-muted">Look straight into the camera. Keep your face centered.</p>

            <div className="py-2">
              <CameraCapture facing="user" shape="circle" videoRef={videoRef} />
            </div>

            {/* Alignment feedback status */}
            <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold">
              {detection?.detected ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                  <UserCheck size={16} /> Face detected ({Math.round((detection.confidence || 0.9) * 100)}%) — Hold
                  steady…
                </span>
              ) : detection?.reason === "MULTIPLE_FACES" ? (
                <span className="text-rose-500 flex items-center justify-center gap-2">
                  <Users size={16} /> Multiple faces detected. Ensure only you are in frame.
                </span>
              ) : (
                <span className="text-amber-500 flex items-center justify-center gap-2">
                  <UserX size={16} /> Center your face inside the circle.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep("intro")}
              className="text-xs text-muted hover:text-navy dark:hover:text-white underline cursor-pointer"
            >
              Cancel registration
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Active Liveness Challenge */}
      {step === "liveness" && (
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-lg font-bold text-navy dark:text-white">Step 2: Active Liveness Check</h2>
            <p className="text-xs text-muted">Confirm active physical presence to complete enrollment.</p>

            <div className="relative py-2">
              <CameraCapture facing="user" shape="circle" videoRef={videoRef} />

              {/* Liveness challenge overlay */}
              {livenessStage === "prompting" && (
                <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center border-2 border-teal animate-fade-in">
                  <ArrowLeftRight size={32} className="text-teal mb-2 animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Action Required</span>
                  <p className="text-sm font-extrabold text-teal mt-1">"Turn your head slightly left"</p>
                  <span className="text-2xl font-mono font-black text-amber-400 mt-2">{countdown.toFixed(1)}s</span>
                </div>
              )}

              {livenessStage === "capturing_a" && (
                <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/70 flex flex-col items-center justify-center text-center">
                  <RefreshCw size={24} className="animate-spin text-teal mb-2" />
                  <span className="text-xs text-white font-medium">Capturing reference…</span>
                </div>
              )}

              {livenessStage === "capturing_b" && (
                <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/70 flex flex-col items-center justify-center text-center">
                  <RefreshCw size={24} className="animate-spin text-teal mb-2" />
                  <span className="text-xs text-white font-medium">Verifying movement…</span>
                </div>
              )}
            </div>

            {livenessStage === "ready" && (
              <button
                type="button"
                onClick={executeLivenessAndEmbedding}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal hover:bg-teal-dark text-white font-bold text-sm shadow-md transition"
              >
                <Sparkles size={18} />
                Begin Liveness Challenge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4 & 5: Generating Descriptor & Submitting to Backend */}
      {(step === "generating" || step === "submitting") && (
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <RefreshCw className="animate-spin text-teal mx-auto mb-4" size={36} />
            <h3 className="text-lg font-bold text-navy dark:text-white">
              {step === "generating" ? "Generating 128-D Biometric Embedding" : "Registering Face Profile"}
            </h3>
            <p className="text-xs text-muted mt-1">
              {step === "generating"
                ? "Extracting facial landmark descriptors via FaceRecognitionNet…"
                : "Securing descriptor into PostgreSQL database…"}
            </p>
          </div>
        </div>
      )}

      {/* Step 6: Registration Success State */}
      {step === "success" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy dark:text-white">Face Profile Registered ✓</h2>
              <p className="text-xs text-muted mt-1">
                Your biometric identity is now active. You are fully set up for classroom attendance verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Student ID:</span>
                <span className="font-mono font-semibold text-navy dark:text-white">{studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Biometric Model:</span>
                <span className="font-semibold text-navy dark:text-white">face-api.js (128-D)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Liveness Verified:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yes (Active Head-Turn)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span className="font-bold text-teal uppercase">Active</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/student/dashboard")}
                className="flex-1 py-3 rounded-xl bg-teal hover:bg-teal-dark text-white font-bold text-sm shadow-md transition"
              >
                Go to Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("intro")
                  setLivenessStage("ready")
                }}
                className="py-3 px-4 rounded-xl border border-border text-navy dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Re-enroll Face
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure / Error State */}
      {step === "error" && (
        <div className="rounded-2xl border border-rose-500/30 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-5">
            <div className="h-16 w-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
              <AlertTriangle size={36} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy dark:text-white">Registration Unsuccessful</h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errorMessage}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={startRegistration}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal hover:bg-teal-dark text-white font-bold text-sm shadow-md transition"
              >
                <RotateCcw size={16} />
                Try Registration Again
              </button>

              <button
                type="button"
                onClick={() => setStep("intro")}
                className="py-3 px-4 rounded-xl border border-border text-navy dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
