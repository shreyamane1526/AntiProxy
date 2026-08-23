export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
      {Icon ? (
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-page text-muted">
          <Icon size={22} />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
