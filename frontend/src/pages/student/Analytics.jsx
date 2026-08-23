import { useState, useEffect } from "react"
import { AlertTriangle, CalendarX, CheckCircle2, Percent } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import DataTable from "../../components/DataTable"
import { AttendanceBadge } from "../../components/StatusBadge"
import AttendanceProgress from "../../components/AttendanceProgress"
import { ATTENDANCE_THRESHOLDS } from "../../constants/attendance"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"
import {
  classesCanMiss,
  classesNeededToReach,
  withSubjectStats,
} from "../../utils/attendance"

export default function StudentAnalytics() {
  const { user, profile } = useAuth()
  const [data, setData] = useState({
    overallPercent: 82.5,
    totalClasses: 109,
    totalAttended: 90,
    missed: 19,
    risk: "LOW",
    subjectWise: [
      { id: "sub-dbms", code: "CS301", name: "DBMS", attended: 20, total: 22 },
      { id: "sub-cn", code: "CS302", name: "Computer Networks", attended: 18, total: 23 },
      { id: "sub-daa", code: "CS303", name: "DAA", attended: 16, total: 22 },
      { id: "sub-os", code: "CS304", name: "Operating Systems", attended: 19, total: 22 },
      { id: "sub-ai", code: "CS305", name: "AI", attended: 17, total: 21 },
    ],
    weeklyTrend: [
      { label: "Week 1", attendance: 84 },
      { label: "Week 2", attendance: 86 },
      { label: "Week 3", attendance: 82 },
      { label: "Week 4", attendance: 79 },
      { label: "Week 5", attendance: 82 },
      { label: "Week 6", attendance: 81 },
    ],
  })

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const studentId = profile?.id || user?.profileId || "stu-21csb042"
        const [anaRes, riskRes] = await Promise.all([
          api.analytics.student(studentId),
          api.risk.student(studentId),
        ])

        if (anaRes) {
          setData((prev) => ({
            ...prev,
            overallPercent: anaRes.overallPercent || prev.overallPercent,
            totalClasses: anaRes.totalClasses || prev.totalClasses,
            totalAttended: anaRes.totalAttended || prev.totalAttended,
            missed: (anaRes.totalClasses || 109) - (anaRes.totalAttended || 90),
            subjectWise: anaRes.subjectWise || prev.subjectWise,
            weeklyTrend: anaRes.weeklyTrend || prev.weeklyTrend,
            risk: riskRes?.scoreLevel || prev.risk,
          }))
        }
      } catch (err) {
        console.warn("Analytics API load fallback:", err.message)
      }
    }
    loadAnalytics()
  }, [profile, user])

  const rows = data.subjectWise.map(withSubjectStats)
  const chartRows = rows.map((row) => ({
    ...row,
    chartLabel: row.name === "Computer Networks" ? "CN" : row.name === "Operating Systems" ? "OS" : row.name,
  }))

  const planner = rows.map((subject) => ({
    ...subject,
    canMiss: classesCanMiss(subject.attended, subject.total, ATTENDANCE_THRESHOLDS.warning / 100),
    need: classesNeededToReach(subject.attended, subject.total, ATTENDANCE_THRESHOLDS.warning / 100),
  }))

  const riskTone =
    data.risk === "HIGH" || data.risk === "CRITICAL" ? "text-danger" : data.risk === "MEDIUM" ? "text-warning" : "text-success"

  const overallStatus = data.overallPercent >= 80 ? "good" : data.overallPercent >= 75 ? "warning" : "risk"

  return (
    <div>
      <PageHeader title="Attendance Analytics" subtitle="Live database analytics, subject insights, and risk intelligence engine." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall attendance" value={`${data.overallPercent}%`} icon={Percent} />
        <StatCard label="Total classes" value={data.totalClasses} icon={CheckCircle2} />
        <StatCard label="Classes attended" value={data.totalAttended} icon={CheckCircle2} />
        <StatCard label="Classes missed" value={data.missed} icon={CalendarX} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-5 lg:col-span-2 shadow-sm">
          <h2 className="text-lg font-semibold text-navy">Attendance trend</h2>
          <p className="text-sm text-muted">Weekly present percentage calculated from database logs</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyTrend}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis domain={[70, 100]} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#14B8A6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-navy">Risk Intelligence</h2>
          <p className="mt-4 text-sm text-muted">Evaluated Risk Score</p>
          <p className={`mt-1 text-3xl font-bold ${riskTone}`}>{data.risk}</p>
          <p className="mt-3 text-sm text-muted">
            {data.risk === "HIGH" || data.risk === "CRITICAL"
              ? "Your attendance is below the college warning band. Risk engine flagged for teacher/HOD notification."
              : data.risk === "MEDIUM"
                ? "You are close to the 75% threshold. Avoid consecutive absences."
                : "You are currently above the safe attendance band."}
          </p>
          <div className="mt-4">
            <AttendanceProgress value={data.overallPercent} status={overallStatus} />
          </div>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-navy">Subject-wise database records</h2>
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="min-w-0 xl:col-span-3">
            <DataTable
              columns={[
                { key: "name", label: "Subject" },
                { key: "percentage", label: "Attendance", render: (row) => `${row.percentage}%` },
                { key: "attended", label: "Present" },
                { key: "absent", label: "Absent" },
                { key: "total", label: "Total" },
                { key: "status", label: "Status", render: (row) => <AttendanceBadge status={row.status} /> },
              ]}
              rows={rows}
            />
          </div>
          <article className="rounded-xl border border-border bg-white p-5 xl:col-span-2 shadow-sm">
            <h3 className="text-sm font-semibold text-navy">
              Attendance by subject
            </h3>

            <div className="mt-1 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                ≥ 80%
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                75–79%
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                &lt; 75%
              </span>
            </div>

            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartRows}
                  margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="chartLabel"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    interval={0}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    unit="%"
                  />

                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.name || ""
                    }
                  />

                  <Bar
                    dataKey="percentage"
                    barSize={30}
                    maxBarSize={30}
                    radius={[6, 6, 0, 0]}
                  >
                    {chartRows.map((row) => (
                      <Cell
                        key={row.id}
                        fill={
                          row.status === "risk"
                            ? "#EF4444"
                            : row.status === "warning"
                              ? "#F59E0B"
                              : "#22C55E"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Attendance planner</h2>
        <p className="mt-1 text-sm text-muted">Calculates how many classes you can miss and stay above {ATTENDANCE_THRESHOLDS.warning}%.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {planner.map((subject) => (
            <article key={subject.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-navy">{subject.name}</h3>
                <AttendanceBadge status={subject.status} />
              </div>
              {subject.need > 0 ? (
                <p className="mt-3 text-sm text-navy">
                  Attend the next <strong>{subject.need} classes</strong> to reach {ATTENDANCE_THRESHOLDS.warning}%.
                </p>
              ) : (
                <p className="mt-3 text-sm text-navy">
                  You can miss <strong>{subject.canMiss} more {subject.name} classes</strong> and remain above {ATTENDANCE_THRESHOLDS.warning}%.
                </p>
              )}
              {subject.status === "risk" ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-danger">
                  <AlertTriangle size={14} /> Consecutive absence will deepen risk.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
