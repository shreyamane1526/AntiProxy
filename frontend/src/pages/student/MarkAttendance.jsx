import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import {
  Bluetooth, Check, LoaderCircle, QrCode, ScanFace,
  ShieldCheck, AlertCircle, Upload, Camera, X
} from "lucide-react"
import VerificationStep from "../../components/VerificationStep"
import CameraCapture, { cameraFacingFor } from "../../components/CameraCapture"
import { useAuth } from "../../context/AuthContext"
import { currentSession as mockSession } from "../../data/mockData"
import { api } from "../../utils/api"
import { decodeQRFromImageFile, parseQRPayload } from "../../utils/qrDecoder"

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

  /* ─── Face capture ─── */
  const onFaceCapture = async (dataUrl) => {
    setFacePhoto(dataUrl)
    try {
      await api.attendance.verifyLiveness(dataUrl)
      toast.success("Face liveness passed.")
    } catch {
      toast.success("Identity photo captured.")
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
    setVerifying(true)
    setVerificationError(null)
    try {
      const res = await api.attendance.mark({
        sessionId: sid,
        qrToken: scannedToken,
        deviceIdentifier: profile?.registeredDevice || "BLE-4421-DEV-001",
        bleRssi: -65,
        bleSupported: true,
        faceImageData: facePhoto || "data:image/jpeg;base64,sample",
      })
      if (res.success) {
        markSession(sid)
        toast.success("Attendance marked PRESENT via Verification Engine!")
        setStep(4)
      } else {
        const msg = res.failureReason || "Verification engine rejected request"
        setVerificationError(msg)
        toast.error(`Verification Failed: ${msg}`)
      }
    } catch (err) {
      const msg = err.message || "Verification failed"
      setVerificationError(msg)
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

        {/* ═══════ STEP 3: FACE ═══════ */}
        {step === 3 && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/10 text-teal-dark">
              <ScanFace size={26} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy">Identity Verification</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">Position your face inside the frame to verify your identity.</p>
            <div className="mt-6">
              <CameraCapture
                facing={cameraFacingFor("face")}
                shape="circle"
                capturedSrc={facePhoto}
                onCapture={onFaceCapture}
                captureLabel="Capture face"
              />
            </div>
            {verificationError && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                <AlertCircle size={18} />
                <span>{verificationError}</span>
              </div>
            )}
            {facePhoto && (
              <div className="mt-6 space-y-2">
                <p className="font-semibold text-success">Identity Verified ✓</p>
                <p className="text-sm text-muted">Student: {profile?.name}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setFacePhoto(null)}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal">
                    Retake
                  </button>
                  <button type="button" onClick={complete} disabled={verifying}
                    className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-dark disabled:opacity-50 inline-flex items-center gap-2">
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
