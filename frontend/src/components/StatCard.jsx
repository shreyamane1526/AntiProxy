export default function StatCard({ label, value, hint, subtext, positive, icon: Icon, children }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        {Icon ? (
          <span className="rounded-xl bg-teal/10 p-2.5 text-teal-dark transition-all duration-300 group-hover:bg-teal group-hover:text-white">
            <Icon size={18} />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2 relative z-10">
        <p className="text-3xl font-extrabold tracking-tight text-navy">{value}</p>
        {subtext && (
          <span className={`text-xs font-semibold ${positive === false ? "text-red-500" : "text-emerald-500"}`}>
            {subtext}
          </span>
        )}
      </div>

      {hint ? <p className="mt-1 text-xs text-muted relative z-10">{hint}</p> : null}
      {children ? <div className="mt-4 relative z-10">{children}</div> : null}
    </article>
  )
}
