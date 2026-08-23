export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted md:text-base">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
