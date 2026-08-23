import PageHeader from "../components/PageHeader"
import Avatar from "../components/Avatar"
import NotificationMenu from "../components/NotificationMenu"
import { useAuth } from "../context/AuthContext"

export default function Profile() {
  const { user, profile } = useAuth()
  const name = profile?.name || user?.name || "User"

  const fields =
    user?.role === "student"
      ? [
          ["Name", profile.name],
          ["Roll no.", profile.rollNo],
          ["Division", profile.division],
          ["Year", profile.year],
          ["Programme", profile.programme],
          ["College email", user.email],
          ["Registered device", profile.registeredDevice],
        ]
      : user?.role === "teacher"
        ? [
            ["Name", profile.name],
            ["Employee ID", profile.employeeId],
            ["Designation", profile.designation],
            ["Department", profile.department],
            ["College email", user.email],
          ]
        : [
            ["Name", profile?.name],
            ["Designation", profile?.designation],
            ["Department", profile?.department],
            ["College email", user?.email],
          ]

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Account details used for attendance verification."
        action={<NotificationMenu />}
      />
      <div className="max-w-xl rounded-xl border border-border bg-white p-6">
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
          <Avatar name={name} src={profile?.photoUrl} size="xl" />
          <div>
            <p className="text-xl font-bold text-navy">{name}</p>
            <p className="mt-0.5 text-sm capitalize text-muted">{user?.role}</p>
            <p className="mt-1 text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        <dl className="space-y-4">
          {fields.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-sm font-semibold text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
