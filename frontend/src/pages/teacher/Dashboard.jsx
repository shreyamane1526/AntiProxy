import { useMemo, useState, useEffect } from "react"
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

function DynamicQrDisplay({ sessionId }) {
  const [qrToken, setQrToken] = useState("")
  const [countdown, setCountdown] = useState(20)

  useEffect(() => {
    let timerId = null

    const fetchQr = async () => {
      try {
        const res = await api.attendance.getQr(sessionId || "current")
        setQrToken(res.qrToken || "QR-DYN-DBMS-1044-0823")
        setCountdown(res.remainingSecondsInWindow || 20)
      } catch (err) {
        setQrToken("QR-DYN-DBMS-1044-0823")
      }
    }

    fetchQr()
    const pollInterval = setInterval(fetchQr, 5000)

    timerId = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 20))
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(timerId)
    }
  }, [sessionId])

  const seed = qrToken || "QR-DEFAULT-SESSION"
  const cells = Array.from({ length: 169 }, (_, index) => {
    const char = seed.charCodeAt(index % seed.length)
    return (char + index * 11) % 7 > 2
  })

  return (
    <div className="text-center space-y-3">
      <div
        className="mx-auto grid w-56 gap-0.5 rounded-xl border-2 border-teal/30 bg-white p-3.5 shadow-md"
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
      >
        {cells.map((filled, index) => (
          <span key={index} className={`aspect-square ${filled ? "bg-navy" : "bg-white"}`} />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
        <p className="text-xs font-mono font-bold tracking-wider text-navy">{qrToken || "GENERATING..."}</p>
      </div>
      <p className="text-xs font-medium text-teal-dark">
        Rotates in <span className="font-bold text-navy">{countdown}s</span> (20s security interval)
      </p>
    </div>
  )
}

export default function TeacherDashboard() {
  const [selected, setSelected] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const lectures = useMemo(() => teacherTimetable.map(lectureLabel), [])

  const openLecture = (slot) => {
    setSelected(slot)
    setQrReady(false)
    setActiveSessionId(null)
  }

  const handleStartSession = async () => {
    try {
      const res = await api.attendance.createSession({
        classId: selected?.classId,
        subjectId: selected?.code,
        room: selected?.room,
        durationMinutes: 5,
      })
      setActiveSessionId(res.sessionId)
      setQrReady(true)
      toast.success("Attendance session started! Dynamic QR active.")
    } catch (err) {
      console.warn("Backend session creation fallback:", err.message)
      setActiveSessionId("sess-dbms-2026-08-23-10")
      setQrReady(true)
      toast.success("Attendance session started.")
    }
  }

  return (
    <div>
      <PageHeader
        title={`${greetingForHour()}, Teacher 👋`}
        subtitle="Here's your lecture schedule. Select a slot to generate the dynamic attendance QR."
      />

      <TimetableView lectures={lectures} onLectureClick={openLecture} />

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null)
          setQrReady(false)
          setActiveSessionId(null)
        }}
        title={selected ? `${selected.subject} · ${selected.division}` : "Lecture"}
      >
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {selected.day} · {formatHour(selected.startHour)}
              {selected.duration > 1 ? ` – ${formatHour(selected.startHour + selected.duration)}` : ""} · {selected.room}
            </p>
            <p className="text-sm font-semibold text-navy">
              {selected.type} · {selected.code}
            </p>

            {!qrReady ? (
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark transition-colors shadow-sm"
              >
                Start Session & Generate Dynamic QR
              </button>
            ) : (
              <div className="space-y-4">
                <DynamicQrDisplay sessionId={activeSessionId} />
                <button
                  type="button"
                  onClick={() => {
                    if (activeSessionId) api.attendance.endSession(activeSessionId).catch(() => {})
                    setQrReady(false)
                    toast.success("Session closed")
                  }}
                  className="w-full rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-xs font-semibold hover:bg-red-100"
                >
                  End Attendance Session
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
