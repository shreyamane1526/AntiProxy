export const ATTENDANCE_THRESHOLDS = {
  good: 80,
  warning: 75,
}

export const RISK_LEVELS = {
  low: 80,
  medium: 75,
}

export const ROLES = {
  student: "student",
  teacher: "teacher",
  hod: "hod",
}

export const ROLE_HOME = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  hod: "/hod/dashboard",
}

export function getAttendanceStatus(percentage) {
  if (percentage >= ATTENDANCE_THRESHOLDS.good) return "good"
  if (percentage >= ATTENDANCE_THRESHOLDS.warning) return "warning"
  return "risk"
}

export function getRiskLevel(percentage) {
  if (percentage >= RISK_LEVELS.low) return "LOW"
  if (percentage >= RISK_LEVELS.medium) return "MEDIUM"
  return "HIGH"
}
