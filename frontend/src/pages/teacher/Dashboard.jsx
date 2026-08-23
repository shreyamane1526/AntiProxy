import { useMemo, useState } from "react"
import PageHeader from "../../components/PageHeader"
import Modal from "../../components/Modal"
import TimetableView, { formatHour } from "../../components/TimetableView"
import { teacherClasses, teacherTimetable } from "../../data/mockData"
import { greetingForHour } from "../../utils/attendance"

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

function DummyQr({ seed }) {
  const cells = Array.from({ length: 169 }, (_, index) => {
    const char = seed.charCodeAt(index % seed.length)
    return (char + index * 11) % 7 > 2
  })

  return (
    <div
      className="mx-auto grid w-52 gap-0.5 rounded-lg border border-border bg-white p-3"
      style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
    >
      {cells.map((filled, index) => (
        <span key={index} className={`aspect-square ${filled ? "bg-navy" : "bg-white"}`} />
      ))}
    </div>
  )
}

export default function TeacherDashboard() {
  const [selected, setSelected] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const lectures = useMemo(() => teacherTimetable.map(lectureLabel), [])

  const openLecture = (slot) => {
    setSelected(slot)
    setQrReady(false)
  }

  return (
    <div>
      <PageHeader
        title={`${greetingForHour()}, Teacher 👋`}
        subtitle="Here's your lecture schedule. Select a slot to generate the attendance QR."
      />

      <TimetableView lectures={lectures} onLectureClick={openLecture} />

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null)
          setQrReady(false)
        }}
        title={selected ? `${selected.subject} · ${selected.division}` : "Lecture"}
      >
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {selected.day} · {formatHour(selected.startHour)}
              {selected.duration > 1 ? ` – ${formatHour(selected.startHour + selected.duration)}` : ""} · {selected.room}
            </p>
            <p className="text-sm text-navy">
              {selected.type} · {selected.code}
            </p>

            {!qrReady ? (
              <button
                type="button"
                onClick={() => setQrReady(true)}
                className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
              >
                Generate QR
              </button>
            ) : (
              <div className="text-center">
                <DummyQr seed={selected.id} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">Dummy session QR</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
