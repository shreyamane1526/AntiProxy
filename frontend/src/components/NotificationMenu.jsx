import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { notifications } from "../data/mockData"

export default function NotificationMenu() {
  const { user } = useAuth()
  const items = notifications[user?.role] || []
  const unread = items.filter((item) => item.unread).length
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-border bg-white p-2.5 text-navy transition hover:border-teal"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <p className="text-xs text-muted">{unread} unread</p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border last:border-0">
                <div className={`px-4 py-3 ${item.unread ? "bg-page/80" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-navy">{item.title}</p>
                    {item.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-muted">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
