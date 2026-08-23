import { useMemo, useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import PageHeader from "../../components/PageHeader"
import Modal from "../../components/Modal"
import TimetableView, { formatHour } from "../../components/TimetableView"
import { teacherClasses, teacherTimetable } from "../../data/mockData"
import { greetingForHour } from "../../utils/attendance"
import { api } from "../../utils/api"
import toast from "react-hot-toast"

function lectureLabel(slot) {
  const cls = teacherClasses.find((item) => item.id === slot.classId)
  return {
    ...slot,
    subject: cls?.name || "Lecture",
    code: cls?.code,
    division: cls?.division,
    type: cls?.type || "Lecture",
    meta: cls?.division,
  }
}

function DynamicQrDisplay({ sessionId, onEndSession }) {
  const [qrPayload, setQrPayload] = useState("")
  const [qrCountdown, setQrCountdown] = useState(30)
  const [sessionCountdown, setSessionCountdown] = useState(300) // 5 minutes (300s)
  const [status, setStatus] = useState("ACTIVE")

  // Fetch 30-second QR Payload from backend
  const fetchQrPayload = useCallback(async () => {
    if (!sessionId || status !== "ACTIVE") return

    try {
      const res = await api.attendance.getQr(sessionId)
      if (res.status === "EXPIRED") {
        setStatus("EXPIRED")
        toast.error("Attendance session expired.")
        return
      }
      if (res.status === "ENDED") {
        setStatus("ENDED")
        return
      }
      setQrPayload(res.qrPayload || `attendance://session/${sessionId}?token=QR-DYN-${Date.now()}`)
      setQrCountdown(30)
    } catch (err) {
      // Local fallback
      setQrPayload(`attendance://session/${sessionId}?token=QR-DYN-${Math.floor(Date.now() / 30000)}`)
      setQrCountdown(30)
    }
  }, [sessionId, status])

  // Initial fetch
  useEffect(() => {
    fetchQrPayload()
  }, [fetchQrPayload])

  // 1-second ticker for 30s QR rotation & 5min session expiry
  useEffect(() => {
    if (status !== "ACTIVE") return

    const timer = setInterval(() => {
      // 5-minute session countdown
      setSessionCountdown((prevSecs) => {
        if (prevSecs <= 1) {
          setStatus("EXPIRED")
          toast.error("Attendance session expired.")
          return 0
        }
        return prevSecs - 1
      })

      // 30-second QR rotation countdown
      setQrCountdown((prevQr) => {
        if (prevQr <= 1) {
          fetchQrPayload()
          return 30
        }
        return prevQr - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status, fetchQrPayload])

  const formatSessionTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const handleEnd = async () => {
    try {
      if (sessionId) {
        await api.attendance.endSession(sessionId)
      }
    } catch (err) {
      // Ignore
    }
    setStatus("ENDED")
    toast.success("Attendance session ended.")
    if (onEndSession) onEndSession()
  }

  if (status === "EXPIRED") {
    return (
      <div className="py-6 text-center space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-base font-bold text-amber-800">Attendance session expired.</p>
        <p className="text-xs text-amber-600">The 5-minute attendance duration has ended. Scanning is disabled.</p>
      </div>
    )
  }

  if (status === "ENDED") {
    return (
      <div className="py-6 text-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-base font-bold text-slate-800">Attendance session ended.</p>
        <p className="text-xs text-slate-500">Session closed by teacher.</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      {/* Session Remaining & QR Refresh Countdowns */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold">
        <span className="text-slate-600">
          Session remaining: <strong className="font-mono text-navy text-sm">{formatSessionTime(sessionCountdown)}</strong>
        </span>
        <span className="text-teal-dark">
          QR refreshes in: <strong className="font-mono text-teal text-sm">{qrCountdown}s</strong>
        </span>
      </div>

      {/* Real Scannable QRCodeSVG */}
      <div className="mx-auto w-fit rounded-xl border-2 border-navy bg-white p-4 shadow-lg">
        <QRCodeSVG
          value={qrPayload || `attendance://session/${sessionId || "demo"}`}
          size={240}
          level="H"
          includeMargin={true}
        />
      </div>

      <p className="text-xs text-muted">
        ATTENDANCE ACTIVE · Project this QR to the classroom for students to scan.
      </p>

      {/* END ATTENDANCE Button */}
      <button
        type="button"
        onClick={handleEnd}
        className="w-full rounded-lg bg-red-600 text-white px-4 py-2.5 text-sm font-bold shadow transition hover:bg-red-700"
      >
        END ATTENDANCE
      </button>
    </div>
  )
}

export default function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState(teacherClasses[0]?.id || "class-dbms-b")
  const [selectedSubjectId, setSelectedSubjectId] = useState("sub-dbms")
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)

  const lectures = useMemo(() => teacherTimetable.map(lectureLabel), [])

  const handleStartAttendance = async (classIdParam, subjectIdParam) => {
    const classId = classIdParam || selectedClassId
    const subjectId = subjectIdParam || selectedSubjectId

    try {
      const res = await api.attendance.createSession({
        classSectionId: classId,
        subjectId: subjectId,
      })
      setActiveSessionId(res.sessionId || `sess-${Date.now()}`)
      setQrReady(true)
      toast.success("Attendance session started! (5 minutes)")
    } catch (err) {
      setActiveSessionId(`sess-${Date.now()}`)
      setQrReady(true)
      toast.success("Attendance session started!")
    }
  }

  const openLecture = (slot) => {
    setSelectedSlot(slot)
    setQrReady(false)
    setActiveSessionId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingForHour()}, Teacher 👋`}
        subtitle="Select a Class and Subject or choose a timetable slot to start a 5-minute attendance session with dynamic 30-second QR codes."
      />

      {/* Class & Subject Selector */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy">Classroom Attendance Session</h2>

        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <div>
            <label className="block text-xs font-bold uppercase text-muted mb-1">
              Select Class / Division
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-sm font-semibold text-navy focus:border-teal focus:outline-none"
            >
              {teacherClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.division})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted mb-1">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-sm font-semibold text-navy focus:border-teal focus:outline-none"
            >
              <option value="sub-dbms">CS301 - Database Management Systems</option>
              <option value="sub-cn">CS302 - Computer Networks</option>
              <option value="sub-daa">CS303 - Design & Analysis of Algorithms</option>
              <option value="sub-os">CS304 - Operating Systems</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => handleStartAttendance(selectedClassId, selectedSubjectId)}
              className="w-full rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-teal-dark"
            >
              START ATTENDANCE
            </button>
          </div>
        </div>

        {/* Live Active Session Panel */}
        {qrReady && activeSessionId ? (
          <div className="pt-4 border-t border-border">
            <DynamicQrDisplay
              sessionId={activeSessionId}
              onEndSession={() => setQrReady(false)}
            />
          </div>
        ) : null}
      </div>

      {/* Timetable Schedule Grid */}
      <TimetableView lectures={lectures} onLectureClick={openLecture} />

      {/* Lecture Slot Modal */}
      <Modal
        open={Boolean(selectedSlot)}
        onClose={() => {
          setSelectedSlot(null)
          setQrReady(false)
          setActiveSessionId(null)
        }}
        title={selectedSlot ? `${selectedSlot.subject} · ${selectedSlot.division}` : "Lecture"}
      >
        {selectedSlot ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {selectedSlot.day} · {formatHour(selectedSlot.startHour)}
              {selectedSlot.duration > 1 ? ` – ${formatHour(selectedSlot.startHour + selectedSlot.duration)}` : ""} · {selectedSlot.room}
            </p>
            <p className="text-sm font-semibold text-navy">
              {selectedSlot.type} · {selectedSlot.code}
            </p>

            {!qrReady ? (
              <button
                type="button"
                onClick={() => handleStartAttendance(selectedSlot.classId, selectedSlot.code)}
                className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark transition-colors shadow-sm"
              >
                START ATTENDANCE
              </button>
            ) : (
              <DynamicQrDisplay
                sessionId={activeSessionId}
                onEndSession={() => setQrReady(false)}
              />
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

