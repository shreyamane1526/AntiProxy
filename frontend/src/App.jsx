import { useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "./context/AuthContext"
import { ROLE_HOME } from "./constants/attendance"
import DashboardLayout from "./components/DashboardLayout"
import Landing from "./pages/Landing"
import StudentDashboard from "./pages/student/Dashboard"
import StudentAnalytics from "./pages/student/Analytics"
import MarkAttendance from "./pages/student/MarkAttendance"
import TeacherDashboard from "./pages/teacher/Dashboard"
import TeacherAnalytics from "./pages/teacher/Analytics"
import HodDashboard from "./pages/hod/Dashboard"
import Profile from "./pages/Profile"

function Unauthorized({ role }) {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (user && user.role !== role) {
      toast.error("You do not have access to that page.")
    }
  }, [user, role, location.pathname])

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  return null
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        element={
          user ? <DashboardLayout /> : <Navigate to="/" replace />
        }
      >
        <Route
          path="/student/dashboard"
          element={user?.role === "student" ? <StudentDashboard /> : <Unauthorized role="student" />}
        />
        <Route
          path="/student/analytics"
          element={user?.role === "student" ? <StudentAnalytics /> : <Unauthorized role="student" />}
        />
        <Route
          path="/student/mark-attendance"
          element={user?.role === "student" ? <MarkAttendance /> : <Unauthorized role="student" />}
        />
        <Route path="/student/profile" element={user?.role === "student" ? <Profile /> : <Unauthorized role="student" />} />

        <Route
          path="/teacher/dashboard"
          element={user?.role === "teacher" ? <TeacherDashboard /> : <Unauthorized role="teacher" />}
        />
        <Route
          path="/teacher/analytics"
          element={user?.role === "teacher" ? <TeacherAnalytics /> : <Unauthorized role="teacher" />}
        />
        <Route path="/teacher/profile" element={user?.role === "teacher" ? <Profile /> : <Unauthorized role="teacher" />} />

        <Route path="/hod/dashboard" element={user?.role === "hod" ? <HodDashboard /> : <Unauthorized role="hod" />} />
        <Route path="/hod/profile" element={user?.role === "hod" ? <Profile /> : <Unauthorized role="hod" />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? ROLE_HOME[user.role] : "/"} replace />} />
    </Routes>
  )
}
