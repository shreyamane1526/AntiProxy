import { NavLink, useNavigate } from "react-router-dom"
import { BarChart3, Fingerprint, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import Avatar from "./Avatar"
import ThemeToggle from "./ThemeToggle"

const links = {
  student: [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/face-registration", label: "Face Profile", icon: Fingerprint },
    { to: "/student/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/student/profile", label: "Profile", icon: UserRound },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/teacher/profile", label: "Profile", icon: UserRound },
  ],
  hod: [
    { to: "/hod/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/hod/profile", label: "Profile", icon: UserRound },
  ],
}

const portalLabel = {
  student: "Student portal",
  teacher: "Faculty portal",
  hod: "HOD portal",
  admin: "Admin portal",
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const nav = links[user?.role] || links.student
  const name = profile?.name || user?.name || "User"

  const onLogout = () => {
    logout()
    toast.success("Signed out.")
    navigate("/")
  }

  return (
    <aside
      className={`flex h-full flex-col bg-navy text-white transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-5">
        {!collapsed ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-white font-black text-base shadow-sm">
                A
              </span>
              <p className="text-2xl font-black tracking-tight text-white font-heading">
                Anti<span className="text-teal font-extrabold">Proxy</span>
              </p>
            </div>
            <p className="text-[11px] uppercase tracking-wider text-teal/80 font-bold mt-1 pl-1">{portalLabel[user?.role] || "Portal"}</p>
          </div>
        ) : (
          <p className="w-full text-center text-xl font-black text-teal">A</p>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-teal text-white shadow-sm font-bold" : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <Icon size={18} />
              {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-white/50 font-medium">Theme Mode</span>
            <ThemeToggle />
          </div>
        )}

        <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar name={name} src={profile?.photoUrl} size="sm" tone="dark" />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-xs capitalize text-white/50">{user?.role}</p>
            </div>
          ) : (
            <span className="sr-only">{name}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} />
          {!collapsed ? <span>Logout</span> : <span className="sr-only">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
