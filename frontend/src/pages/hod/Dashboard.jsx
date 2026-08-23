import { useState, useEffect } from "react"
import { Building2, AlertTriangle, ShieldCheck, Users, CheckCircle2, Sliders } from "lucide-react"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"

export default function HodDashboard() {
  const { profile } = useAuth()
  const [deptAnalytics, setDeptAnalytics] = useState({
    department: "Computer Science & Engineering",
    overallAverage: 82.3,
    totalDivisions: 4,
    totalStudents: 180,
    atRiskCount: 14,
    divisions: [
      { division: "CSE-A", average: 84.1, total: 45, atRisk: 3 },
      { division: "CSE-B", average: 81.4, total: 45, atRisk: 5 },
      { division: "CSE-C", average: 83.0, total: 45, atRisk: 2 },
      { division: "CSE-D", average: 80.8, total: 45, atRisk: 4 },
    ],
  })
  const [rules, setRules] = useState([
    { id: "rule-1", name: "Low Attendance Warning", threshold_percent: 80.0, action: "STUDENT_WARNING", enabled: true },
    { id: "rule-2", name: "Defaulter Threshold Alert", threshold_percent: 75.0, action: "FACULTY_ALERT", enabled: true },
    { id: "rule-3", name: "Critical HOD Escalation", threshold_percent: 70.0, action: "HOD_ESCALATION", enabled: true },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHodData() {
      try {
        const [anaRes, rulesRes] = await Promise.all([
          api.analytics.department("dept-cse"),
          api.rules.get(),
        ])
        if (anaRes) setDeptAnalytics(anaRes)
        if (rulesRes?.rules) setRules(rulesRes.rules)
      } catch (err) {
        console.warn("HOD API load fallback:", err.message)
      } finally {
        setLoading(false)
      }
    }
    loadHodData()
  }, [])

  const toggleRule = async (ruleId, currentVal) => {
    try {
      await api.rules.update(ruleId, { enabled: !currentVal })
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentVal } : r)))
    } catch (err) {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentVal } : r)))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.name || "Dr. Kavita Iyer"} 👋`}
        subtitle="Department Head Portal · Attendance intelligence, risk monitoring, and policy enforcement."
      />

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dept Attendance"
          value={`${deptAnalytics.overallAverage}%`}
          change="+1.4%"
          positive
          icon={Building2}
        />
        <StatCard
          label="Enrolled Students"
          value={deptAnalytics.totalStudents}
          subtext={`${deptAnalytics.totalDivisions} Divisions`}
          icon={Users}
        />
        <StatCard
          label="Defaulters / At-Risk"
          value={deptAnalytics.atRiskCount}
          subtext="< 75% Attendance Threshold"
          positive={false}
          icon={AlertTriangle}
        />
        <StatCard
          label="Active Security Rules"
          value={rules.filter((r) => r.enabled).length}
          subtext="Verification Policies Active"
          icon={ShieldCheck}
        />
      </div>

      {/* Division Overview & Configurable Rules Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Division Attendance Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Building2 size={20} className="text-teal-dark" />
              Division-wise Attendance Overview
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted bg-slate-100 px-2.5 py-1 rounded-md">
              {deptAnalytics.department}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {deptAnalytics.divisions.map((div) => (
              <div key={div.division} className="rounded-xl border border-border/60 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-navy">{div.division}</h3>
                    <p className="text-xs text-muted">{div.total} Students · {div.atRisk} At Risk</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-navy">{div.average}%</span>
                    <p className="text-xs font-medium text-teal-dark">Avg Attendance</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      div.average >= 82 ? "bg-teal" : div.average >= 75 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${div.average}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy & Security Rules Panel */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Sliders size={20} className="text-teal-dark" />
              Attendance Rules
            </h2>
          </div>
          <p className="text-xs text-muted">
            Configurable thresholds enforced by the backend risk intelligence engine.
          </p>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-white">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-navy">{rule.name}</p>
                  <p className="text-xs text-muted">Threshold: <span className="font-bold text-navy">{rule.threshold_percent}%</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id, rule.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.enabled ? "bg-teal" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rule.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
