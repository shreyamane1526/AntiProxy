import { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import Modal from "./Modal"
import { ROLE_HOME } from "../constants/attendance"
import { useAuth } from "../context/AuthContext"

const roles = [
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "hod", label: "HOD" },
]

export default function AuthModal({ open, onClose }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [loading, setLoading] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error("Enter your college email.")
      return
    }
    if (!password) {
      toast.error("Enter your password.")
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      const user = login({ email, role })
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`)
      setLoading(false)
      onClose?.()
      navigate(ROLE_HOME[user.role])
    }, 450)
  }

  return (
    <Modal open={open} onClose={onClose} title="Login to dashboard">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">College email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@college.edu"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-teal"
          />
        </label>
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-navy">Role</legend>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-sm font-medium transition ${
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
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </Modal>
  )
}
