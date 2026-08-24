import { useEffect, useRef, useState } from "react"
import { Camera, LoaderCircle } from "lucide-react"
import { decodeQRFromImageData } from "../utils/qrDecoder"

export function isHandheldDevice() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua) || iPadOs
}

export function cameraFacingFor(step) {
  const handheld = isHandheldDevice()
  if (step === "qr") return handheld ? "environment" : "user"
  return "user"
}

export default function CameraCapture({
  facing = "user",
  shape = "square",
  onCapture,
  onFrameScan,
  capturedSrc,
  captureLabel = "Capture photo",
  videoRef: externalVideoRef,
}) {
  const localVideoRef = useRef(null)
  const videoRef = externalVideoRef || localVideoRef
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState("requesting")
  const [error, setError] = useState("")

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startCamera = async () => {
    stopStream()
    setStatus("requesting")
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus("live")
    } catch (err) {
      setStatus(err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" ? "denied" : "error")
      setError(err?.message || "Camera could not be opened.")
    }
  }

  useEffect(() => {
    if (capturedSrc) {
      stopStream()
      return undefined
    }
    startCamera()
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, capturedSrc])

  // Continuous frame QR scanner loop
  useEffect(() => {
    if (status !== "live" || !onFrameScan || capturedSrc) return

    let animId
    let lastScanTime = 0

    const scanLoop = (timestamp) => {
      // Throttle scan to every 200ms for high performance
      if (timestamp - lastScanTime > 200) {
        lastScanTime = timestamp
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas && video.readyState >= 2) {
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          const ctx = canvas.getContext("2d")
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const decoded = decodeQRFromImageData(imageData)
            if (decoded && !decoded.error) {
              onFrameScan(decoded, canvas.toDataURL("image/jpeg", 0.9))
              return
            }
          } catch (e) {}
        }
      }
      animId = requestAnimationFrame(scanLoop)
    }

    animId = requestAnimationFrame(scanLoop)
    return () => cancelAnimationFrame(animId)
  }, [status, onFrameScan, capturedSrc])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext("2d")
    if (facing === "user") {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture?.(canvas.toDataURL("image/jpeg", 0.9))
  }

  const frameClass = shape === "circle" ? "rounded-full" : "rounded-xl"
  const sizeClass = shape === "circle" ? "h-64 w-64" : "h-64 w-64 sm:h-72 sm:w-72"

  return (
    <div className="mx-auto max-w-sm">
      <div className={`relative mx-auto overflow-hidden bg-slate-dark ${frameClass} ${sizeClass}`}>
        {capturedSrc ? (
          <img src={capturedSrc} alt="Captured" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
            playsInline
            muted
            autoPlay
          />
        )}

        {shape === "square" && !capturedSrc ? (
          <>
            <span className="pointer-events-none absolute left-3 top-3 h-8 w-8 border-l-4 border-t-4 border-teal" />
            <span className="pointer-events-none absolute right-3 top-3 h-8 w-8 border-r-4 border-t-4 border-teal" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 border-b-4 border-l-4 border-teal" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b-4 border-r-4 border-teal" />
            {status === "live" ? <span className="scan-line pointer-events-none absolute left-6 right-6 h-0.5 bg-teal" /> : null}
          </>
        ) : null}

        {shape === "circle" && status === "live" && !capturedSrc ? (
          <span className="face-scan-ring pointer-events-none absolute inset-3 rounded-full border border-teal/70" />
        ) : null}

        {status === "requesting" && !capturedSrc ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-dark/80 text-white">
            <p className="inline-flex items-center gap-2 text-sm">
              <LoaderCircle className="animate-spin" size={18} />
              Requesting camera…
            </p>
          </div>
        ) : null}

        {(status === "denied" || status === "error") && !capturedSrc ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-dark px-4 text-center text-sm text-white">
            <p>{status === "denied" ? "Camera permission was denied. Allow camera access to continue." : error}</p>
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <p className="mt-3 text-center text-xs text-muted">
        Using {facing === "environment" ? "rear camera" : "front camera"}
      </p>

      {!capturedSrc && status === "live" ? (
        <button
          type="button"
          onClick={capture}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Camera size={16} />
          {captureLabel}
        </button>
      ) : null}

      {!capturedSrc && (status === "denied" || status === "error") ? (
        <button
          type="button"
          onClick={startCamera}
          className="mt-4 w-full rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:border-teal"
        >
          Try camera again
        </button>
      ) : null}
    </div>
  )
}
