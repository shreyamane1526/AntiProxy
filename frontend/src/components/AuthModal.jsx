import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import Modal from "./Modal"
import { ROLE_HOME } from "../constants/attendance"
import { useAuth } from "../context/AuthContext"
import { api } from "../utils/api"

const roles = [
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "hod", label: "HOD" },
  { id: "admin", label: "Admin" },
]

const demoCredentials = [
  { role: "student", label: "Student", email: "aanya.sharma@college.edu" },
  { role: "teacher", label: "Teacher", email: "r.mehta@college.edu" },
  { role: "hod", label: "HOD", email: "hod.cse@college.edu" },
  { role: "admin", label: "Admin", email: "admin@college.edu" },
]

export default function AuthModal({ open, onClose, initialMode = "login" }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState(initialMode) // "login" | "register"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [rollNo, setRollNo] = useState("")
  const [division, setDivision] = useState("CSE-B")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  const autofillDemo = (demo) => {
    setEmail(demo.email)
    setPassword("demo")
    setRole(demo.role)
    toast.success(`Autofilled demo account for ${demo.label}`)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error("Enter your college email.")
      return
    }
    if (!password) {
      toast.error("Enter your password.")
      return
    }
    if (mode === "register" && !name.trim()) {
      toast.error("Enter your full name.")
      return
    }

    setLoading(true)
    try {
      if (mode === "register") {
        await api.auth.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          roll_no: rollNo.trim() || undefined,
          division: division.trim() || undefined,
        })
        toast.success("Account created successfully! Logging in...")
      }

      const user = await login({ email, password, role })
      toast.success(`Welcome back, ${user.name ? user.name.split(" ")[0] : "User"}.`)
      onClose?.()
      navigate(ROLE_HOME[user.role] || ROLE_HOME.student)
    } catch (err) {
      toast.error(err.message || "Authentication failed. Check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "login" ? "Login to AntiProxy" : "Register New Account"}>
      <div className="flex border-b border-border mb-4">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
            mode === "login" ? "border-teal text-teal-dark font-bold" : "border-transparent text-muted hover:text-navy"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
            mode === "register" ? "border-teal text-teal-dark font-bold" : "border-transparent text-muted hover:text-navy"
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aanya Sharma"
              required
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-teal"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">College email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@college.edu"
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-teal"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-teal"
          />
        </label>

        {mode === "register" && role === "student" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-navy">Roll No</span>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="21CSB042"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-teal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-navy">Division</span>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="CSE-B"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-teal"
              />
            </label>
          </div>
        )}

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-navy">Role</legend>
          <div className="grid grid-cols-4 gap-2">
            {roles.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-semibold transition ${
                  role === item.id ? "border-teal bg-teal/10 text-teal-dark" : "border-border text-muted hover:border-teal/40"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.id}
                  checked={role === item.id}
                  onChange={() => setRole(item.id)}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-70"
        >
          {loading ? (mode === "login" ? "Signing in..." : "Creating Account...") : mode === "login" ? "Login" : "Register Account"}
        </button>

        {mode === "login" && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Quick Demo Database Accounts (Password: <code className="font-mono text-navy">demo</code>)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => autofillDemo(demo)}
                  className="rounded-lg border border-border bg-slate-50 p-2 text-left hover:border-teal hover:bg-teal/5 transition-colors"
                >
                  <p className="text-xs font-bold text-navy">{demo.label}</p>
                  <p className="text-[11px] font-mono text-muted truncate">{demo.email}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
