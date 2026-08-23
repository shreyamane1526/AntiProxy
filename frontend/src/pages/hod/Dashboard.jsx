import { Building2 } from "lucide-react"
import PageHeader from "../../components/PageHeader"
import EmptyState from "../../components/EmptyState"
import { useAuth } from "../../context/AuthContext"

export default function HodDashboard() {
  const { profile } = useAuth()

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.name || "HOD"}`}
        subtitle="Department-level attendance monitoring will appear here."
      />
      <EmptyState
        icon={Building2}
        title="HOD dashboard coming soon"
        description="This portal will summarise division-wise attendance, faculty session health, and students below the college threshold. The student and teacher experiences are fully prototyped."
      />
    </div>
  )
}
