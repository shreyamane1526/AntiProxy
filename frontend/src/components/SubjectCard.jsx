import AttendanceProgress from "./AttendanceProgress"
import { AttendanceBadge } from "./StatusBadge"

export default function SubjectCard({ subject }) {
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-teal/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{subject.code}</p>
          <h3 className="mt-1 text-lg font-semibold text-navy">{subject.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{subject.teacher}</p>
        </div>
        <AttendanceBadge status={subject.status} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-2xl font-bold text-navy">{subject.percentage}%</p>
        <p className="text-sm text-muted">
          {subject.attended}/{subject.total} lectures
        </p>
      </div>
      <div className="mt-3">
        <AttendanceProgress value={subject.percentage} status={subject.status} />
      </div>
    </article>
  )
}
