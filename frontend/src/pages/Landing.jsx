import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLE_HOME } from "../constants/attendance"
import {
  ArrowRight,
  Bluetooth,
  ChartColumnIncreasing,
  QrCode,
  ScanFace,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react"
import AuthModal from "../components/AuthModal"
import ThemeToggle from "../components/ThemeToggle"

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Verification",
    text: "Attendance is accepted only after BLE presence, a dynamic session QR, and face verification.",
  },
  {
    icon: Timer,
    title: "Real-Time Attendance",
    text: "Once all three checks pass, the lecture is marked Present immediately in the classroom session.",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Smart Analytics",
    text: "Subject-wise percentages, attendance risk, and planner insights for students and faculty.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    text: "Separate portals for students, teachers, and HODs, each with the right classroom context.",
  },
]

const steps = [
  { n: "01", title: "Connect registered device via BLE", text: "Confirm you are physically in the classroom." },
  { n: "02", title: "Scan classroom QR", text: "Read the dynamic QR issued for this attendance session." },
  { n: "03", title: "Complete face verification", text: "Match identity against the enrolled student profile." },
  { n: "04", title: "Attendance marked", text: "Status is recorded as Present for the lecture." },
]

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState("login")
  const { user } = useAuth()
  const navigate = useNavigate()

  const openAuth = (mode = "login") => {
    if (user) {
      navigate(ROLE_HOME[user.role] || ROLE_HOME.student)
    } else {
      setAuthMode(mode)
      setAuthOpen(true)
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-navy via-slate-800 to-teal text-white font-black text-lg shadow-sm">
              A
            </span>
            <span className="text-2xl font-black tracking-tight text-navy font-heading">
              Anti<span className="text-teal-dark">Proxy</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <button type="button" className="hover:text-navy" onClick={() => scrollTo("features")}>
              Features
            </button>
            <button type="button" className="hover:text-navy" onClick={() => scrollTo("how")}>
              How it works
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-dark"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:border-teal"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-dark shadow-sm"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-teal-dark mb-4">
            <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
            AntiProxy Attendance Platform
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-navy md:text-6xl font-heading">
            <span className="bg-gradient-to-r from-navy via-slate-800 to-teal bg-clip-text text-transparent">AntiProxy</span> Attendance Engine.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            AntiProxy combines Bluetooth presence, 20-second dynamic QR sessions, and facial liveness checks so colleges record attendance that is impossible to proxy.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openAuth("register")}
              className="inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-dark shadow-md hover:shadow-lg"
            >
              Register New Account
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-navy transition hover:border-teal"
            >
              Sign In Existing User
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-page p-6 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Verification pipeline</p>
          <ol className="space-y-3">
            {[
              { icon: Bluetooth, label: "BLE Connection" },
              { icon: QrCode, label: "Dynamic 20s QR" },
              { icon: ScanFace, label: "Face Liveness & Match" },
              { icon: ShieldCheck, label: "Verified Attendance" },
            ].map((item, index, list) => {
              const Icon = item.icon
              return (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-teal-dark shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="font-semibold text-navy">{item.label}</span>
                  {index < list.length - 1 ? <span className="ml-auto text-xs text-muted">then</span> : null}
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section id="features" className="border-t border-border bg-page py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">Built for real classrooms</h2>
          <p className="mt-2 max-w-2xl text-muted">Every lecture is treated as an attendance session with a registered device, a live QR, and a verified identity.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal-dark">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 font-semibold text-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">How it works</h2>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-stretch">
            {steps.map((step, index) => (
              <article key={step.n} className="relative flex-1 rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-teal-dark">{step.n}</p>
                <h3 className="mt-2 font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
                {index < steps.length - 1 ? (
                  <span className="absolute -right-3 top-8 hidden text-teal md:block" aria-hidden>
                    →
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-navy py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl font-heading">Make attendance smarter with AntiProxy.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Open the portal to register, sign in, or run a live attendance verification session.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => openAuth("register")}
              className="rounded-xl bg-teal px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-dark shadow-md"
            >
              Register New Account
            </button>
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Sign In Existing User
            </button>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  )
}
