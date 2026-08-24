import { useState, useEffect } from "react"
import { ArrowLeft, Users } from "lucide-react"
import PageHeader from "../../components/PageHeader"
import DataTable from "../../components/DataTable"
import AttendanceProgress from "../../components/AttendanceProgress"
import { AttendanceBadge } from "../../components/StatusBadge"
import { getAttendanceStatus } from "../../constants/attendance"
import { percentage } from "../../utils/attendance"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"

function withStats(student) {
  const pct = student.percent !== undefined ? student.percent : percentage(student.present, student.total)
  return {
    ...student,
    absent: Math.max(0, student.total - student.present),
    percentage: pct,
    status: getAttendanceStatus(pct),
  }
}

export default function TeacherAnalytics() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [classId, setClassId] = useState(null)
  const [classApiData, setClassApiData] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.attendance.getTeacherAssignments()
        if (res && res.assignments) {
          const map = new Map()
          res.assignments.forEach((a) => {
            if (!map.has(a.class_id)) {
              map.set(a.class_id, {
                id: a.class_id,
                name: a.subject_name,
                code: a.subject_code,
                division: a.class_division,
                type: "Lecture",
              })
            }
          })
          setAssignments(Array.from(map.values()))
        }
      } catch (err) {
        console.warn("Teacher assignments fetch error:", err.message)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    if (classId) {
      async function loadClassAnalytics() {
        try {
          const res = await api.analytics.class(classId)
          if (res) setClassApiData(res)
        } catch (err) {
          console.warn("Class analytics API fallback:", err.message)
        }
      }
      loadClassAnalytics()
    } else {
      setClassApiData(null)
    }
  }, [classId])

  const selected = assignments.find((item) => item.id === classId)

  const rawStudents = classApiData?.students || []
  const students = rawStudents.map(withStats)

  if (selected || classApiData) {
    const title = classApiData ? classApiData.className : `${selected?.name} · ${selected?.division}`
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
          title={title}
          subtitle={`Live DB Records · ${students.length} enrolled students`}
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
      <PageHeader title="Student Analytics" subtitle="Select a class to view live database attendance records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assignments.map((item) => (
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
          </button>
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-muted col-span-full">No class assignments found.</p>
        )}
      </div>
    </div>
  )
}
