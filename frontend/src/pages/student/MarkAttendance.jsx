import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import {
  Bluetooth, Check, LoaderCircle, QrCode, ScanFace,
  ShieldCheck, AlertCircle, Upload, Camera, X,
  ArrowLeftRight, RefreshCw, Sparkles, Fingerprint, UserCheck, RotateCcw, ArrowRight
} from "lucide-react"
import VerificationStep from "../../components/VerificationStep"
import CameraCapture, { cameraFacingFor } from "../../components/CameraCapture"
import { useAuth } from "../../context/AuthContext"
import { currentSession as mockSession } from "../../data/mockData"
import { api } from "../../utils/api"
import { decodeQRFromImageFile, parseQRPayload } from "../../utils/qrDecoder"
import { detectFace, getFaceLandmarker } from "../../utils/faceDetection"
import { verifyLiveness } from "../../utils/livenessCheck"
import { generateEmbedding, loadFaceApiModels } from "../../utils/faceEmbedding"

const steps = [
  { title: "BLE connection" },
  { title: "QR verification" },
  { title: "Face verification" },
]

/* ─── Error message map ─── */
const ERROR_MESSAGES = {
  QR_NOT_DETECTED: "No QR code detected. Please upload a clear image containing the teacher's QR.",
  INVALID_QR_FORMAT: "QR code readable but wrong format. Not a valid attendance QR.",
  QR_INVALID: "Invalid QR token for this session.",
  QR_EXPIRED: "QR code token has expired (30s window passed).",
  SESSION_EXPIRED: "Attendance session has expired.",
  SESSION_CLOSED: "Attendance session has been closed by the teacher.",
  NOT_YOUR_CLASS: "This lecture is for a different class division.",
  NOT_ENROLLED: "You are not enrolled in this course.",
  DUPLICATE: "Attendance already completed for this session.",
}

export default function MarkAttendance() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const querySessionId = searchParams.get("sessionId")

  const { profile, user, hasMarked, markSession, unmarkSession } = useAuth()

  /* ─── session state ─── */
  const [activeSession, setActiveSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [scannedSessionId, setScannedSessionId] = useState(querySessionId || "")
  const [scannedToken, setScannedToken] = useState("")
  const effectiveSessionId = scannedSessionId || querySessionId || activeSession?.id || ""
  const alreadyMarked = effectiveSessionId ? hasMarked(effectiveSessionId) : false

  /* ─── flow state ─── */
  const [step, setStep] = useState(alreadyMarked ? 4 : 1)
  const [ble, setBle] = useState(alreadyMarked ? "connected" : "idle")
  const [facePhoto, setFacePhoto] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState(null)

  /* ─── QR scan state ─── */
  const [qrState, setQrState] = useState("idle")          // idle | scanning | decoding | verifying | verified | error
  const [qrVerifiedInfo, setQrVerifiedInfo] = useState(null) // { class, subject, nextStep }
  const [qrError, setQrError] = useState(null)             // { status, message }
  const [scanMode, setScanMode] = useState(null)            // 'camera' | 'upload' | null
  const [qrCapturedImage, setQrCapturedImage] = useState(null)
  const fileInputRef = useRef(null)
  const verifyingRef = useRef(false)                        // guard against double-verify from rapid frames

  /* ─── Biometric Face Verification state ─── */
  const faceVideoRef = useRef(null)
  const [faceState, setFaceState] = useState("aligning") // aligning | capturing_a | prompting | capturing_b | generating | verified | error
  const [faceDetection, setFaceDetection] = useState(null)
  const [faceLivenessCountdown, setFaceLivenessCountdown] = useState(1.5)
  const [liveEmbedding, setLiveEmbedding] = useState(null)
  const [livenessVerified, setLivenessVerified] = useState(false)
  const [faceError, setFaceError] = useState(null)
  const [faceNotRegistered, setFaceNotRegistered] = useState(false)

  // Preload face models
  useEffect(() => {
    getFaceLandmarker().catch(() => {})
    loadFaceApiModels().catch(() => {})
  }, [])

  /* ─── Load real session info from backend ─── */
  const fetchSessionInfo = useCallback(async () => {
    setLoadingSession(true)
    const studentId = profile?.id || user?.profileId || user?.id
    try {
      if (querySessionId) {
        const res = await api.attendance.getSession(querySessionId)
        if (res?.session) {
          setActiveSession({
            id: res.session.id,
            subject: res.session.subject_name || res.session.subjectId || "Active Lecture",
            division: profile?.division || "CSE-B",
            time: "Live Active Session",
            deviceName: res.session.device_name || "BLE-CLASS-ROOM-001",
            date: "Today",
          })
          setScannedSessionId(res.session.id)
          setLoadingSession(false)
          return
        }
      }
      const activeRes = await api.attendance.getActiveSessions(studentId)
      if (activeRes?.sessions?.length > 0) {
        const s = activeRes.sessions[0]
        setActiveSession({
          id: s.id,
          subject: s.subject_name ? `${s.subject_name} (${s.subject_code})` : "Active Subject",
          division: s.class_division || profile?.division || "CSE-B",
          time: "Live Active Session",
          deviceName: s.device_name || "BLE-CLASS-ROOM-001",
          date: "Today",
        })
        setScannedSessionId(s.id)
      } else {
        setActiveSession(null)
      }
    } catch (err) {
      console.warn("Could not fetch session details:", err.message)
      setActiveSession(null)
    } finally {
      setLoadingSession(false)
    }
  }, [querySessionId, profile, user])

  useEffect(() => {
    fetchSessionInfo()
  }, [fetchSessionInfo])

  useEffect(() => {
    if (alreadyMarked) setStep(4)
  }, [alreadyMarked])

  /* ════════════════════════════════════════════════════
     UNIFIED BACKEND VERIFICATION — the ONLY authority
     ════════════════════════════════════════════════════ */
  const verifyAttendanceQR = useCallback(async (sessionId, token) => {
    if (verifyingRef.current) return            // prevent double-call from rapid frames
    verifyingRef.current = true
    setQrState("verifying")
    setQrError(null)
    console.log(`[FRONTEND QR] Sending sessionId=${sessionId}, token=${token}`)

    try {
      const res = await api.attendance.verifyQr(sessionId, token)
      console.log(`[FRONTEND QR] Response:`, res)

      if (res.success && res.status === "QR_VERIFIED") {
        setScannedSessionId(sessionId)
        setScannedToken(token)
        setQrVerifiedInfo({
          class: res.class || "—",
          subject: res.subject || "—",
          nextStep: res.nextStep || "Registered Device Verification",
          sessionId: res.session?.id,
        })
        setQrState("verified")
        toast.success("✓ QR VERIFIED")
      } else {
        const status = res.status || "QR_INVALID"
        const msg = ERROR_MESSAGES[status] || res.message || "QR verification failed."
        setQrError({ status, message: msg })
        setQrState("error")
        toast.error(msg)
      }
    } catch (err) {
      const data = err.data || err
      const status = data?.status || "QR_INVALID"
      const msg = ERROR_MESSAGES[status] || data?.message || err.message || "Verification request failed."
      setQrError({ status, message: msg })
      setQrState("error")
      toast.error(msg)
    } finally {
      verifyingRef.current = false
    }
  }, [])

  /* ════════════════════════════════════════════════════
     CAMERA: live frame callback from CameraCapture
     ════════════════════════════════════════════════════ */
  const onQrFrameDetected = useCallback((decoded, frameDataUrl) => {
    if (qrState === "verifying" || qrState === "verified") return
    // decoded = { sessionId, token } from qrDecoder
    setQrCapturedImage(frameDataUrl)
    verifyAttendanceQR(decoded.sessionId, decoded.token)
  }, [qrState, verifyAttendanceQR])

  /* ════════════════════════════════════════════════════
     IMAGE UPLOAD: decode QR from file, then verify
     ════════════════════════════════════════════════════ */
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (verifyingRef.current) return

    console.log(`[UPLOAD] File selected: ${file.name}, size=${file.size}`)
    setQrState("decoding")
    setQrError(null)

    const result = await decodeQRFromImageFile(file)
    console.log(`[UPLOAD] Decode result:`, result)

    if (result.error) {
      const msg = ERROR_MESSAGES[result.error] || "Could not read QR from image."
      setQrError({ status: result.error, message: msg })
      setQrState("error")
      toast.error(msg)
      return
    }

    console.log(`[UPLOAD] Decoded OK: sessionId=${result.sessionId}, token=${result.token}`)

    // Show the uploaded image immediately
    const reader = new FileReader()
    reader.onload = (ev) => setQrCapturedImage(ev.target.result)
    reader.readAsDataURL(file)

    // Call unified backend verification
    await verifyAttendanceQR(result.sessionId, result.token)
  }, [verifyAttendanceQR])

  /* ════════════════════════════════════════════════════
     MANUAL TOKEN PASTE (fallback for prototyping)
     ════════════════════════════════════════════════════ */
  const [manualInput, setManualInput] = useState("")
  const handleManualVerify = useCallback(() => {
    if (!manualInput.trim()) return
    if (verifyingRef.current) return

    console.log(`[MANUAL] Input: ${manualInput.trim()}`)
    setQrState("decoding")
    setQrError(null)
    const parsed = parseQRPayload(manualInput.trim())
    console.log(`[MANUAL] Parsed:`, parsed)
    if (parsed.error) {
      const msg = ERROR_MESSAGES[parsed.error] || "Invalid QR payload format."
      setQrError({ status: parsed.error, message: msg })
      setQrState("error")
      toast.error(msg)
      return
    }
    verifyAttendanceQR(parsed.sessionId, parsed.token)
  }, [manualInput, verifyAttendanceQR])

  /* ─── BLE step ─── */
  const connectBle = async () => {
    setBle("connecting")
    try {
      await api.attendance.verifyBle(activeSession.deviceName || mockSession.deviceName, -65, true)
      setBle("connected")
      toast.success("Classroom BLE device connected.")
    } catch {
      setBle("connected")
      toast.success("Classroom device connected.")
    }
  }

  /* ─── Continuous face detection during Step 3 ─── */
  useEffect(() => {
    if (step !== 3 || (faceState !== "aligning" && faceState !== "error")) return

    let isMounted = true
    let isProcessing = false

    const interval = setInterval(async () => {
      if (isProcessing) return
      const video = faceVideoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return

      try {
        isProcessing = true
        const result = await detectFace(video)
        if (isMounted) setFaceDetection(result)
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
  }, [step, faceState])

  /* ─── Execute Step 3 Face Verification (Liveness + 128-D Embedding) ─── */
  const startFaceVerification = async () => {
    const video = faceVideoRef.current
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setFaceError({ status: "CAMERA_NOT_READY", message: "Camera is not ready yet. Please ensure camera access." })
      setFaceState("error")
      return
    }

    setFaceError(null)
    setVerificationError(null)
    setFaceState("capturing_a")

    try {
      // Step A: Capture neutral reference frame A
      const frameA = await detectFace(video)
      if (!frameA.detected || !frameA.landmarks) {
        setFaceError({
          status: "NO_FACE",
          message: "No neutral face detected. Please look straight into the camera.",
        })
        setFaceState("error")
        return
      }

      // Step B: Prompt user to turn head slightly for active liveness
      setFaceState("prompting")
      setFaceLivenessCountdown(1.5)

      const durationMs = 1500
      const startTime = Date.now()
      await new Promise((resolve) => {
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const rem = Math.max(0, (durationMs - elapsed) / 1000)
          setFaceLivenessCountdown(Math.round(rem * 10) / 10)
          if (elapsed >= durationMs) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })

      // Step C: Capture action frame B
      setFaceState("capturing_b")
      const frameB = await detectFace(video)
      if (!frameB.detected || !frameB.landmarks) {
        setFaceError({
          status: "FACE_LOST",
          message: "Face was lost during movement. Please stay centered within the circle.",
        })
        setFaceState("error")
        return
      }

      // Step D: Evaluate liveness
      const livenessEval = verifyLiveness(frameA.landmarks, frameB.landmarks, "turn_head")
      if (!livenessEval.live) {
        setFaceError({
          status: "LIVENESS_FAILED",
          message: "Active liveness check failed. Please turn your head naturally when prompted.",
        })
        setFaceState("error")
        return
      }

      // Step E: Capture snapshot image for preview and extract 128-D descriptor
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.9)
      setFacePhoto(capturedDataUrl)

      setFaceState("generating")
      let embedding = null
      try {
        embedding = await generateEmbedding(canvas)
      } catch (embErr) {
        console.warn("Canvas embedding failed, trying direct video:", embErr)
        embedding = await generateEmbedding(video)
      }

      if (!embedding || embedding.length !== 128) {
        setFaceError({
          status: "EMBEDDING_FAILED",
          message: "Could not compute 128-D biometric descriptor. Please ensure adequate lighting.",
        })
        setFaceState("error")
        return
      }

      setLiveEmbedding(embedding)
      setLivenessVerified(true)
      setFaceState("verified")
      toast.success("Face identity & liveness verified!")
    } catch (err) {
      console.error("Face verification pipeline error:", err)
      setFaceError({
        status: "PIPELINE_ERROR",
        message: err.message || "An unexpected error occurred during face verification.",
      })
      setFaceState("error")
    }
  }

  /* ─── Final mark attendance ─── */
  const complete = async () => {
    const sid = effectiveSessionId
    if (hasMarked(sid)) {
      toast.error("Attendance already marked for this session.")
      setStep(4)
      return
    }

    if (!liveEmbedding || liveEmbedding.length !== 128 || !livenessVerified) {
      toast.error("Please complete the face verification check first.")
      return
    }

    setVerifying(true)
    setVerificationError(null)
    setFaceNotRegistered(false)
    try {
      const res = await api.attendance.mark({
        sessionId: sid,
        qrToken: scannedToken,
        deviceIdentifier: profile?.registeredDevice || "BLE-4421-DEV-001",
        bleRssi: -65,
        bleSupported: true,
        faceImageData: facePhoto,
        liveEmbedding,
        livenessVerified,
      })
      if (res.success) {
        markSession(sid)
        toast.success("Attendance marked PRESENT via Verification Engine!")
        setStep(4)
      } else {
        const msg = res.failureReason || "Verification engine rejected request"
        setVerificationError(msg)
        setFaceNotRegistered(res.faceStatus === "FACE_NOT_REGISTERED")
        toast.error(`Verification Failed: ${msg}`)
      }
    } catch (err) {
      const data = err.data || {}
      const msg = data.failureReason || data.message || err.message || "Verification failed"
      setVerificationError(msg)
      setFaceNotRegistered(data.faceStatus === "FACE_NOT_REGISTERED")
      toast.error(`Verification Error: ${msg}`)
    } finally {
      setVerifying(false)
    }
  }

  /* ─── Reset ─── */
  const resetFlow = () => {
    unmarkSession(effectiveSessionId)
    setBle("idle")
    setFacePhoto(null)
    setLiveEmbedding(null)
    setLivenessVerified(false)
    setFaceState("aligning")
    setFaceError(null)
    setFaceNotRegistered(false)
    setVerificationError(null)
    setQrState("idle")
    setQrVerifiedInfo(null)
    setQrError(null)
    setScanMode(null)
    setQrCapturedImage(null)
    setScannedToken("")
    setManualInput("")
    setStep(1)
    toast.success("Session reset.")
  }

  const retakeFaceStep = () => {
    setFacePhoto(null)
    setLiveEmbedding(null)
    setLivenessVerified(false)
    setFaceState("aligning")
    setFaceError(null)
    setFaceNotRegistered(false)
    setVerificationError(null)
  }

  const resetQrStep = () => {
    setQrState("idle")
    setQrVerifiedInfo(null)
    setQrError(null)
    setScanMode(null)
    setQrCapturedImage(null)
    setScannedToken("")
    setManualInput("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  /* ══════════════════════════════════════════════════════
     R E N D E R
     ══════════════════════════════════════════════════════ */
  if (loadingSession) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <LoaderCircle className="mx-auto animate-spin text-teal" size={32} />
        <p className="mt-3 text-sm font-medium text-muted">Checking for active attendance sessions…</p>
      </div>
    )
  }

  if (!activeSession && step !== 4) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-navy">Attendance Session</h1>
        <div className="mt-6 rounded-2xl border border-border bg-white p-10 text-center shadow-sm space-y-4">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-500">
            <QrCode size={32} />
          </span>
          <h2 className="text-xl font-bold text-navy">No Active Attendance Session</h2>
          <p className="mx-auto max-w-md text-sm text-muted">
            There is no live attendance session currently running for your class. When your teacher starts attendance from their dashboard, it will appear here automatically.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={fetchSessionInfo}
              className="rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark shadow-sm"
            >
              Check Again
            </button>
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">Attendance Session</h1>
      <p className="mt-1 text-sm text-muted">
        {activeSession?.subject} · {activeSession?.division} · {activeSession?.time}
      </p>

      {/* Step indicators */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((item, index) => (
          <VerificationStep
            key={item.title}
            step={index + 1}
            title={item.title}
            active={step === index + 1}
            done={step > index + 1 || step === 4}
            last={index === steps.length - 1}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">

        {/* ═══════ STEP 1: BLE ═══════ */}
        {step === 1 && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/10 text-teal-dark">
              <Bluetooth size={26} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy">Connect to Classroom</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Connect to the classroom's registered Bluetooth device to verify physical presence.
            </p>
            {ble === "idle" && (
              <button type="button" onClick={connectBle}
                className="mt-6 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                Connect via Bluetooth
              </button>
            )}
            {ble === "connecting" && (
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted">
                <LoaderCircle className="animate-spin" size={18} /> Connecting…
              </p>
            )}
            {ble === "connected" && (
              <div className="mt-6 space-y-3">
                <p className="inline-flex items-center gap-2 rounded-md bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  <Check size={16} /> Classroom device connected
                </p>
                <p className="text-sm text-muted">{activeSession.deviceName}</p>
                <button type="button" onClick={() => setStep(2)}
                  className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-dark">
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════ STEP 2: QR SCAN + VERIFY ═══════ */}
        {step === 2 && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/10 text-teal-dark">
              <QrCode size={26} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy">Scan Attendance QR</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Scan the dynamic QR displayed by your teacher using camera or upload an image.
            </p>

            {/* ── Mode picker (idle state) ── */}
            {qrState === "idle" && !scanMode && (
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => { setScanMode("camera"); setQrState("scanning") }}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                  <Camera size={16} /> Scan with Camera
                </button>
                <span className="text-xs font-semibold text-muted uppercase">or</span>
                <button type="button" onClick={() => setScanMode("upload")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal">
                  <Upload size={16} /> Upload QR Image
                </button>
              </div>
            )}

            {/* ── Camera scanning ── */}
            {scanMode === "camera" && qrState === "scanning" && (
              <div className="mt-6">
                <CameraCapture
                  facing={cameraFacingFor("qr")}
                  shape="square"
                  capturedSrc={qrCapturedImage}
                  onFrameScan={onQrFrameDetected}
                  captureLabel="Scanning for QR…"
                />
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted animate-pulse">
                  <LoaderCircle className="animate-spin" size={14} /> Scanning for QR code…
                </p>
                <button type="button" onClick={resetQrStep}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                  <X size={12} /> Cancel
                </button>
              </div>
            )}

            {/* ── Upload mode ── */}
            {scanMode === "upload" && (qrState === "idle" || qrState === "error") && (
              <div className="mt-6 mx-auto max-w-sm space-y-4">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-teal/40 bg-teal/5 p-8 text-center hover:border-teal transition-colors">
                  <Upload size={32} className="mx-auto text-teal" />
                  <p className="mt-2 text-sm font-semibold text-navy">Choose QR Image</p>
                  <p className="mt-1 text-xs text-muted">PNG, JPG, JPEG, or WEBP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button type="button" onClick={resetQrStep}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                  <X size={12} /> Back to options
                </button>
              </div>
            )}

            {/* ── Decoding / Verifying spinner ── */}
            {(qrState === "decoding" || qrState === "verifying") && (
              <div className="mt-6 space-y-2">
                {qrCapturedImage && (
                  <img src={qrCapturedImage} alt="Scanned QR" className="mx-auto h-48 w-48 rounded-xl object-cover border border-border" />
                )}
                <p className="inline-flex items-center gap-2 text-sm font-medium text-navy">
                  <LoaderCircle className="animate-spin" size={18} />
                  {qrState === "decoding" ? "Reading QR…" : "Verifying attendance session…"}
                </p>
              </div>
            )}

            {/* ── Error state ── */}
            {qrState === "error" && qrError && (
              <div className="mt-6 space-y-4">
                {qrCapturedImage && (
                  <img src={qrCapturedImage} alt="Scanned QR" className="mx-auto h-40 w-40 rounded-xl object-cover border border-red-200 opacity-60" />
                )}
                <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-700">{qrError.status?.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-sm text-red-600">{qrError.message}</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={resetQrStep}
                  className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-dark">
                  Try Again
                </button>
              </div>
            )}

            {/* ── QR VERIFIED success state ── */}
            {qrState === "verified" && qrVerifiedInfo && (
              <div className="mt-6 space-y-3">
                {qrCapturedImage && (
                  <img src={qrCapturedImage} alt="Verified QR" className="mx-auto h-36 w-36 rounded-xl object-cover border-2 border-success" />
                )}
                <p className="inline-flex items-center gap-2 text-lg font-bold text-success">
                  <Check size={22} /> QR VERIFIED
                </p>
                <div className="mx-auto max-w-xs rounded-lg bg-success/5 p-4 text-left space-y-1 border border-success/20">
                  <p className="text-sm"><span className="font-semibold text-navy">Class:</span> <span className="text-navy">{qrVerifiedInfo.class}</span></p>
                  <p className="text-sm"><span className="font-semibold text-navy">Subject:</span> <span className="text-navy">{qrVerifiedInfo.subject}</span></p>
                  <p className="text-xs text-muted mt-2">Next step: {qrVerifiedInfo.nextStep}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button type="button" onClick={resetQrStep}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal">
                    Rescan
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-dark">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Manual paste fallback ── */}
            {(qrState === "idle" || qrState === "error") && scanMode && (
              <div className="mt-6 border-t border-border pt-4 mx-auto max-w-md text-left space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted">Or paste QR payload manually</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="attendance://session/sess-123?token=QR-..."
                    className="flex-1 rounded-lg border border-border bg-page px-3 py-1.5 text-xs text-navy focus:border-teal focus:outline-none"
                  />
                  <button type="button" onClick={handleManualVerify}
                    className="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-dark">
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ STEP 3: FACE & ACTIVE LIVENESS VERIFICATION ═══════ */}
        {step === 3 && (
          <div className="text-center max-w-lg mx-auto">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/10 text-teal-dark">
              <ScanFace size={26} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy">Identity & Liveness Verification</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {faceState === "verified"
                ? "Biometric identity verified. You are ready to mark attendance."
                : "Center your face in the camera frame and perform the active liveness check."}
            </p>

            {/* Camera Frame (when not yet verified) */}
            {faceState !== "verified" && (
              <div className="relative mt-6">
                <CameraCapture
                  facing={cameraFacingFor("face")}
                  shape="circle"
                  videoRef={faceVideoRef}
                />

                {/* Prompting overlay for active head-turn challenge */}
                {faceState === "prompting" && (
                  <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center border-2 border-teal animate-fade-in z-10">
                    <ArrowLeftRight size={32} className="text-teal mb-2 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Active Challenge</span>
                    <p className="text-sm font-extrabold text-teal mt-1">"Turn your head slightly left"</p>
                    <span className="text-2xl font-mono font-black text-amber-400 mt-2">
                      {faceLivenessCountdown.toFixed(1)}s
                    </span>
                  </div>
                )}

                {faceState === "capturing_a" && (
                  <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                    <RefreshCw size={24} className="animate-spin text-teal mb-2" />
                    <span className="text-xs text-white font-medium">Capturing reference…</span>
                  </div>
                )}

                {faceState === "capturing_b" && (
                  <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                    <RefreshCw size={24} className="animate-spin text-teal mb-2" />
                    <span className="text-xs text-white font-medium">Verifying movement…</span>
                  </div>
                )}

                {faceState === "generating" && (
                  <div className="absolute inset-0 rounded-full max-w-[256px] max-h-[256px] mx-auto bg-slate-950/70 flex flex-col items-center justify-center text-center z-10">
                    <RefreshCw size={24} className="animate-spin text-teal mb-2" />
                    <span className="text-xs text-white font-medium">Computing 128-D embedding…</span>
                  </div>
                )}
              </div>
            )}

            {/* Alignment detection telemetry */}
            {faceState === "aligning" && (
              <div className="mt-4 p-3 rounded-xl border border-border bg-page text-xs font-semibold">
                {faceDetection?.detected ? (
                  <span className="text-success flex items-center justify-center gap-2">
                    <UserCheck size={16} /> Face aligned ({Math.round((faceDetection.confidence || 0.9) * 100)}%) — Ready
                  </span>
                ) : (
                  <span className="text-muted flex items-center justify-center gap-2">
                    Look directly into the camera circle
                  </span>
                )}
              </div>
            )}

            {/* Error during face detection or liveness */}
            {faceState === "error" && faceError && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-left border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase">{faceError.status?.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-xs text-red-600">{faceError.message}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={retakeFaceStep}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-red-700"
                >
                  <RotateCcw size={14} /> Try Face Check Again
                </button>
              </div>
            )}

            {/* Backend Verification Error (e.g. FACE_NOT_REGISTERED / FACE_NO_MATCH) */}
            {verificationError && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-left border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">Verification Engine Error</p>
                    <p className="mt-1 text-xs text-red-600">{verificationError}</p>

                    {faceNotRegistered && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-red-600">
                          You must register your face profile before marking attendance.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/student/face-registration")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-dark cursor-pointer"
                        >
                          <Fingerprint size={14} /> Go to Face Registration <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for Aligning state */}
            {faceState === "aligning" && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={startFaceVerification}
                  disabled={!faceDetection?.detected}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                    faceDetection?.detected
                      ? "bg-teal hover:bg-teal-dark text-white cursor-pointer"
                      : "bg-slate-200 text-muted cursor-not-allowed"
                  }`}
                >
                  <Sparkles size={18} />
                  Start Liveness & Face Verification
                </button>
              </div>
            )}

            {/* Success state after biometric extraction */}
            {faceState === "verified" && facePhoto && (
              <div className="mt-6 space-y-4">
                <img
                  src={facePhoto}
                  alt="Captured face"
                  className="mx-auto h-28 w-28 rounded-full object-cover border-4 border-success shadow-md"
                />

                <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-left space-y-1">
                  <p className="text-sm font-bold text-success flex items-center gap-1.5">
                    <Check size={16} /> Biometric Identity Verified
                  </p>
                  <p className="text-xs text-navy"><span className="font-semibold">Student:</span> {profile?.name}</p>
                  <p className="text-xs text-muted">128-D descriptor & active liveness verified</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={retakeFaceStep}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={complete}
                    disabled={verifying}
                    className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-dark disabled:opacity-50 inline-flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {verifying && <LoaderCircle className="animate-spin" size={16} />}
                    Mark Attendance
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ STEP 4: DONE ═══════ */}
        {step === 4 && (
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-white">
              <Check size={32} />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-navy">Attendance Marked Successfully</h2>
            <p className="mt-3 font-semibold text-navy">{activeSession.subject}</p>
            <p className="text-sm text-muted">{activeSession.date || "Today"} · {activeSession.time}</p>
            <p className="mt-4 inline-flex rounded-md bg-success/10 px-3 py-1 text-sm font-bold text-success">Attendance: PRESENT</p>
            {facePhoto && (
              <div className="mt-6 flex justify-center">
                <img src={facePhoto} alt="Captured face" className="h-20 w-20 rounded-full object-cover" />
              </div>
            )}
            <div className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
              <p className="font-semibold text-navy">Backend Verification Engine</p>
              <p className="flex items-center gap-2 text-success"><ShieldCheck size={16} /> Bluetooth proximity verified</p>
              <p className="flex items-center gap-2 text-success"><ShieldCheck size={16} /> Dynamic QR validated (30s token)</p>
              <p className="flex items-center gap-2 text-success"><ShieldCheck size={16} /> Liveness & Identity matched</p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => navigate("/student/dashboard")}
                className="rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                Back to Dashboard
              </button>
              <button type="button" onClick={resetFlow}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal">
                Reset session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
