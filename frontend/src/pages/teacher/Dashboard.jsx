import { useMemo, useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import PageHeader from "../../components/PageHeader"
import Modal from "../../components/Modal"
import TimetableView, { formatHour } from "../../components/TimetableView"
import { greetingForHour } from "../../utils/attendance"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"
import toast from "react-hot-toast"

function lectureLabel(slot) {
  if (!slot) return null;
  const dayStr = slot.day || slot.dayOfWeek || "Monday";
  const startH = Number(slot.startHour) || (slot.startTime ? parseInt(slot.startTime.split(":")[0], 10) : 9);
  const dur = Number(slot.duration) || 1;
  const classId = slot.classId || slot.class_id;
  const subjectId = slot.subjectId || slot.subject_id;

  return {
    ...slot,
    classId,
    subjectId,
    day: dayStr,
    startHour: startH,
    duration: dur,
    subject: slot.subject || slot.subject_name || "Lecture",
    code: slot.code || slot.subject_code || "CS000",
    division: slot.division || slot.class_division || "N/A",
    type: slot.type || "Lecture",
    meta: slot.division || slot.class_division || "N/A",
    room: slot.room || "Room 201",
  };
}

function DynamicQrDisplay({ sessionId, onEndSession }) {
  const [qrPayload, setQrPayload] = useState("")
  const [qrCountdown, setQrCountdown] = useState(30)
  const [sessionCountdown, setSessionCountdown] = useState(300) // 5 minutes (300s)
  const [status, setStatus] = useState("ACTIVE")
  const [endSummary, setEndSummary] = useState(null)

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
      if (res.sessionExpiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(res.sessionExpiresAt) - new Date()) / 1000))
        setSessionCountdown(remaining)
      }

      setQrPayload(res.qrPayload || `attendance://session/${sessionId}?token=QR-DYN-${Date.now()}`)
      
      // Calculate exactly how many seconds are left in this backend window
      if (res.qrExpiresAt) {
        const remainingQr = Math.max(1, Math.floor((new Date(res.qrExpiresAt) - new Date()) / 1000))
        setQrCountdown(remainingQr)
      } else {
        setQrCountdown(30)
      }
    } catch (err) {
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
      // Session countdown - tick every second
      setSessionCountdown((prev) => Math.max(0, prev - 1))

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
        const res = await api.attendance.endSession(sessionId)
        if (res && res.summary) {
          setEndSummary(res.summary)
        }
      }
      setStatus("ENDED")
      toast.success("Attendance session ended.")
    } catch (err) {
      console.error("Failed to end session:", err)
      toast.error(err?.message || err?.data?.message || "Failed to end session on server.")
    }
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
      <div className="py-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-base font-bold text-slate-800 text-center">Attendance session ended.</p>
        {endSummary ? (
          <div className="space-y-3">
            <div className="flex justify-center gap-6 text-sm font-semibold">
              <span className="text-green-700">Present: {endSummary.present}</span>
              <span className="text-red-600">Absent: {endSummary.absent}</span>
              <span className="text-navy">Total: {endSummary.total}</span>
            </div>
            {endSummary.presentStudents.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-green-700 mb-1">Present</p>
                <div className="flex flex-wrap gap-1">
                  {endSummary.presentStudents.map((s) => (
                    <span key={s.student_id} className="inline-block rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5 font-medium">{s.student_name || s.roll_no || s.student_id}</span>
                  ))}
                </div>
              </div>
            )}
            {endSummary.absentStudents.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-red-600 mb-1">Absent</p>
                <div className="flex flex-wrap gap-1">
                  {endSummary.absentStudents.map((s) => (
                    <span key={s.student_id} className="inline-block rounded-full bg-red-100 text-red-800 text-xs px-2 py-0.5 font-medium">{s.student_name || s.roll_no || s.student_id}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center">Session closed by teacher.</p>
        )}
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

      <div className="space-y-2">
        <p className="text-xs text-muted font-mono bg-page p-2 rounded border border-border break-all">
          {qrPayload || `attendance://session/${sessionId}`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (qrPayload) {
              navigator.clipboard.writeText(qrPayload)
              toast.success("QR Payload copied! Paste in Student Mark Attendance page.")
            }
          }}
          className="rounded-lg border border-teal text-teal-dark px-3 py-1.5 text-xs font-bold hover:bg-teal/10 transition"
        >
          📋 Copy QR Payload for Student Test
        </button>
      </div>

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
  const { user, profile } = useAuth()
  const teacherName = profile?.name || user?.name || "Teacher"
  const [assignments, setAssignments] = useState([])
  const [dbTimetable, setDbTimetable] = useState([])
  const [selectedClassId, setSelectedClassId] = useState("cls-cse-a")
  const [selectedSubjectId, setSelectedSubjectId] = useState("sub-cs301")
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const res = await api.attendance.getTeacherAssignments()
        if (res && res.assignments && res.assignments.length > 0) {
          setAssignments(res.assignments)
          setSelectedClassId(res.assignments[0].class_id)
          setSelectedSubjectId(res.assignments[0].subject_id)
        }

        const ttRes = await api.timetables.get({ teacherId: profile?.id || user?.id })
        if (ttRes && ttRes.timetables && ttRes.timetables.length > 0) {
          setDbTimetable(ttRes.timetables)
        }
      } catch (err) {
        console.warn("Teacher data fetch fallback:", err.message)
      }
    }
    loadTeacherData()
  }, [profile, user])

  const availableClasses = useMemo(() => {
    if (assignments.length === 0) return []
    const map = new Map()
    assignments.forEach((a) => {
      if (!map.has(a.class_id)) {
        map.set(a.class_id, {
          id: a.class_id,
          division: a.class_division,
          name: `${a.subject_name} (${a.class_division})`,
        })
      }
    })
    return Array.from(map.values())
  }, [assignments])

  const availableSubjects = useMemo(() => {
    if (assignments.length === 0) {
      return [
        { id: "sub-cs301", code: "CS301", name: "Database Management Systems" },
        { id: "sub-cs302", code: "CS302", name: "Operating Systems" },
        { id: "sub-cs303", code: "CS303", name: "Computer Networks" },
        { id: "sub-cs304", code: "CS304", name: "Software Engineering" },
        { id: "sub-cs305", code: "CS305", name: "Data Structures" },
      ]
    }
    const filtered = assignments.filter((a) => a.class_id === selectedClassId)
    const map = new Map()
    filtered.forEach((a) => {
      if (!map.has(a.subject_id)) {
        map.set(a.subject_id, {
          id: a.subject_id,
          code: a.subject_code,
          name: a.subject_name,
        })
      }
    })
    return Array.from(map.values())
  }, [assignments, selectedClassId])

  const rawLectures = dbTimetable.length > 0 ? dbTimetable : []
  const lectures = useMemo(() => rawLectures.map(lectureLabel).filter(Boolean), [rawLectures])

  const handleStartAttendance = async (classIdParam, subjectIdParam, slotDayParam = null, slotHourParam = null) => {
    const classId = classIdParam || selectedClassId
    const subjectId = subjectIdParam || selectedSubjectId

    try {
      const res = await api.attendance.createSession({
        classSectionId: classId,
        subjectId: subjectId,
        slotDay: slotDayParam,
        slotHour: slotHourParam,
      })
      setActiveSessionId(res.sessionId || `sess-${Date.now()}`)
      setQrReady(true)
      toast.success("Attendance session started! (5 minutes)")
    } catch (err) {
      toast.error(err.message || "Failed to start attendance session")
    }
  }

  const openLecture = async (slot) => {
    setSelectedSlot(slot);
    await handleStartAttendance(slot.classId, slot.subjectId, slot.day, slot.startHour);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingForHour()}, ${teacherName.split(" ")[0]} 👋`}
        subtitle="Select a Class and Subject or choose a timetable slot to start a 5-minute attendance session with dynamic 30-second QR codes."
      />

      {/* Class & Subject Selector */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-navy">Classroom Attendance Session</h2>
          <p className="text-sm text-muted">Click a timetable slot below to start attendance for that specific lecture.</p>

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
                onClick={() => handleStartAttendance(selectedSlot.classId, selectedSlot.subjectId, selectedSlot.day, selectedSlot.startHour)}
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
