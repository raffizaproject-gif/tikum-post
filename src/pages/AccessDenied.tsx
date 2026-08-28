import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-14 text-center">
      <h1 className="heading-hero text-2xl text-ink">Access denied</h1>
      <p className="max-w-sm text-sm text-muted">
        Your account doesn't have permission to view this page.
      </p>
      <Link to="/dashboard" className="focus-ring rounded-full bg-ink px-6 py-3 text-sm font-medium text-white">
        Back to dashboard
      </Link>
    </div>
  )
}
