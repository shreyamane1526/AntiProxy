export default function StatCard({ label, value, hint, icon: Icon, children }) {
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon ? (
          <span className="rounded-lg bg-teal/10 p-2 text-teal-dark">
            <Icon size={16} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  )
}
