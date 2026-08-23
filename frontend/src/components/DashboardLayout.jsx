import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import Sidebar from "./Sidebar"

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-page">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full w-64">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          className="m-3 w-fit rounded-lg p-2 text-navy hover:bg-white lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <main className="flex-1 px-4 py-6 pt-2 md:px-6 lg:px-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
