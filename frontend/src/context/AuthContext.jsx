import { createContext, useContext, useMemo, useState } from "react"
import { users, studentProfile, teacherProfile, hodProfile } from "../data/mockData"

const AuthContext = createContext(null)
const STORAGE_KEY = "attendix.user"

function profileFor(user) {
  if (user.role === "student") return studentProfile
  if (user.role === "teacher") return teacherProfile
  return hodProfile
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [markedSessions, setMarkedSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("attendix.marked") || "[]")
    } catch {
      return []
    }
  })

  const value = useMemo(
    () => ({
      user,
      profile: user ? profileFor(user) : null,
      markedSessions,
      login: ({ email, role }) => {
        const match =
          users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.role === role) ||
          users.find((item) => item.role === role)
        const next = { ...match, email: email.trim() || match.email }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      },
      logout: () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      },
      hasMarked: (sessionId) => markedSessions.includes(sessionId),
      markSession: (sessionId) => {
        setMarkedSessions((prev) => {
          if (prev.includes(sessionId)) return prev
          const next = [...prev, sessionId]
          localStorage.setItem("attendix.marked", JSON.stringify(next))
          return next
        })
      },
      unmarkSession: (sessionId) => {
        setMarkedSessions((prev) => {
          const next = prev.filter((id) => id !== sessionId)
          localStorage.setItem("attendix.marked", JSON.stringify(next))
          return next
        })
      },
    }),
    [user, markedSessions],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
