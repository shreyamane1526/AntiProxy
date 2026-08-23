import { createContext, useContext, useMemo, useState, useEffect } from "react"
import { api } from "../utils/api"

const AuthContext = createContext(null)
const STORAGE_KEY = "attendix.user"
const TOKEN_KEY = "attendix.token"

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

  // Sync token validation on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !user) {
      api.auth.me()
        .then((res) => {
          if (res.user) {
            setUser(res.user)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user))
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        })
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile: user ? (user.profile || { name: user.name, email: user.email }) : null,
      markedSessions,
      login: async ({ email, password, role }) => {
        try {
          const res = await api.auth.login({ email, password, role })
          const authenticatedUser = {
            ...res.user,
            email: email.trim() || res.user.email,
            profile: res.profile,
          }
          localStorage.setItem(TOKEN_KEY, res.access_token)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser))
          setUser(authenticatedUser)
          return authenticatedUser
        } catch (err) {
          // Strictly throw backend authentication errors. No mock fallback!
          console.error("Backend authentication error:", err.message)
          throw new Error(err.data?.message || err.message || "Invalid email or password")
        }
      },
      logout: () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TOKEN_KEY)
        api.auth.logout().catch(() => {})
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
