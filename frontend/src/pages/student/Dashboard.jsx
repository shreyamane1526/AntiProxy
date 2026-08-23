import { useNavigate } from "react-router-dom"
import { AlertTriangle, BookOpen, CalendarCheck2, Percent } from "lucide-react"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import AttendanceProgress from "../../components/AttendanceProgress"
import TimetableView from "../../components/TimetableView"
import { useAuth } from "../../context/AuthContext"
import { studentTimetable, subjects } from "../../data/mockData"
import { greetingForHour, overallFromSubjects } from "../../utils/attendance"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const name = profile?.name || "Student"
  const overall = overallFromSubjects(subjects)
  const lectures = studentTimetable.map((slot) => ({
    ...slot,
    meta: slot.teacher,
  }))

  return (
    <div>
      <PageHeader
        title={`${greetingForHour()}, ${name.split(" ")[0]} 👋`}
        subtitle="Here's your attendance overview."
        action={
          <button
            type="button"
            onClick={() => navigate("/student/mark-attendance")}
            className="rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark"
          >
            Mark Attendance
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall attendance" value={`${overall.percentage}%`} hint="Across all lectures this term" icon={Percent}>
          <AttendanceProgress value={overall.percentage} status={overall.status} variant="bar" />
        </StatCard>
        <StatCard label="Classes attended" value={`${overall.attended} / ${overall.total}`} hint="Present in recorded lectures" icon={CalendarCheck2} />
        <StatCard label="Subjects at risk" value={overall.atRiskCount} hint="Below 75% attendance" icon={AlertTriangle} />
        <StatCard label="Division" value={profile?.division || "CSE-B"} hint={profile?.programme || "B.Tech CSE"} icon={BookOpen} />
      </section>

      <section className="mt-8">
        <TimetableView lectures={lectures} />
      </section>
    </div>
  )
}
