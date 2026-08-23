import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import Sidebar from "./Sidebar"
import ThemeToggle from "./ThemeToggle"

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-page transition-colors duration-200">
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
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-navy hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-navy">AntiProxy</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-6 pt-4 md:px-6 lg:px-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
