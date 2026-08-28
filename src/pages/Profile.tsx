import { useAuth } from '@/hooks/useAuth'

export default function Profile() {
  const { profile } = useAuth()

  return (
    <div className="container-page py-14 md:py-20">
      <h1 className="heading-hero text-2xl text-ink">Profile</h1>
      <div className="mt-8 max-w-md rounded-card border border-line bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">Full name</dt>
            <dd className="mt-1 text-ink">{profile?.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted">Username</dt>
            <dd className="mt-1 text-ink">@{profile?.username}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1 text-ink">{profile?.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Role</dt>
            <dd className="mt-1 capitalize text-ink">{profile?.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
