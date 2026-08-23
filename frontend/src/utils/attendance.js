import { getAttendanceStatus, getRiskLevel } from "../constants/attendance"

export function percentage(attended, total) {
  if (!total) return 0
  return Math.round((attended / total) * 1000) / 10
}

export function withSubjectStats(subject) {
  const pct = percentage(subject.attended, subject.total)
  return {
    ...subject,
    percentage: pct,
    status: getAttendanceStatus(pct),
    absent: Math.max(0, subject.total - subject.attended),
  }
}

export function overallFromSubjects(subjects) {
  const attended = subjects.reduce((sum, item) => sum + item.attended, 0)
  const total = subjects.reduce((sum, item) => sum + item.total, 0)
  const pct = percentage(attended, total)
  return {
    attended,
    total,
    missed: Math.max(0, total - attended),
    percentage: pct,
    status: getAttendanceStatus(pct),
    risk: getRiskLevel(pct),
    atRiskCount: subjects.filter((item) => getAttendanceStatus(percentage(item.attended, item.total)) === "risk").length,
  }
}

export function classesCanMiss(attended, total, threshold = 0.75) {
  const remaining = (attended - threshold * total) / threshold
  return Math.max(0, Math.floor(remaining + 1e-9))
}

export function classesNeededToReach(attended, total, threshold = 0.75) {
  const current = total ? attended / total : 0
  if (current >= threshold) return 0
  const needed = Math.ceil((threshold * total - attended) / (1 - threshold) - 1e-9)
  return Math.max(0, needed)
}

export function greetingForHour(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
