const barColor = {
  good: "bg-success",
  warning: "bg-warning",
  risk: "bg-danger",
}

export default function AttendanceProgress({ value, status = "good", variant = "bar" }) {
  const clamped = Math.max(0, Math.min(100, value))

  if (variant === "circle") {
    return (
      <div
        className="relative grid h-24 w-24 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${status === "risk" ? "#EF4444" : status === "warning" ? "#F59E0B" : "#22C55E"} ${clamped * 3.6}deg, #E2E8F0 0deg)`,
        }}
        role="img"
        aria-label={`${clamped}% attendance`}
      >
        <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-sm font-bold text-navy">
          {clamped}%
        </div>
      </div>
    )
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${barColor[status] || barColor.good}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
