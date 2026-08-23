const styles = {
  good: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  risk: "bg-danger/10 text-danger",
  present: "bg-success/10 text-success",
  absent: "bg-danger/10 text-danger",
  live: "bg-teal/10 text-teal-dark",
  upcoming: "bg-page text-muted",
}

const labels = {
  good: "On track",
  warning: "At warning",
  risk: "At risk",
  present: "Present",
  absent: "Absent",
  live: "Live session",
  upcoming: "Upcoming",
}

export default function StatusBadge({ status, children }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${styles[status] || "bg-border text-muted"}`}>
      {children || labels[status] || status}
    </span>
  )
}

export function AttendanceBadge({ status }) {
  return <StatusBadge status={status} />
}
