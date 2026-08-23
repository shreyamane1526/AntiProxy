import { useState } from "react"
import { ArrowLeft, Users } from "lucide-react"
import PageHeader from "../../components/PageHeader"
import DataTable from "../../components/DataTable"
import AttendanceProgress from "../../components/AttendanceProgress"
import { AttendanceBadge } from "../../components/StatusBadge"
import { teacherClasses } from "../../data/mockData"
import { getAttendanceStatus } from "../../constants/attendance"
import { percentage } from "../../utils/attendance"

function withStats(student) {
  const pct = percentage(student.present, student.total)
  return {
    ...student,
    absent: Math.max(0, student.total - student.present),
    percentage: pct,
    status: getAttendanceStatus(pct),
  }
}

export default function TeacherAnalytics() {
  const [classId, setClassId] = useState(null)
  const selected = teacherClasses.find((item) => item.id === classId)
  const students = selected ? selected.students.map(withStats) : []

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setClassId(null)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-navy"
        >
          <ArrowLeft size={16} />
          All classes
        </button>
        <PageHeader
          title={`${selected.name} · ${selected.division}`}
          subtitle={`${selected.code} · ${selected.type} · ${students.length} students`}
        />
        <DataTable
          columns={[
            { key: "name", label: "Student" },
            { key: "rollNo", label: "Roll no." },
            { key: "present", label: "Present" },
            { key: "absent", label: "Absent" },
            {
              key: "percentage",
              label: "Attendance",
              render: (row) => (
                <div className="min-w-[140px]">
                  <p className="mb-1 text-sm font-semibold text-navy">{row.percentage}%</p>
                  <AttendanceProgress value={row.percentage} status={row.status} />
                </div>
              ),
            },
            { key: "status", label: "Status", render: (row) => <AttendanceBadge status={row.status} /> },
          ]}
          rows={students}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Student Analytics" subtitle="Select a class to view student attendance." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teacherClasses.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setClassId(item.id)}
            className="rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-teal/50"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.code}</p>
            <h3 className="mt-1 text-lg font-semibold text-navy">{item.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {item.division} · {item.type}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-teal-dark">
              <Users size={16} />
              {item.students.length} students
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
