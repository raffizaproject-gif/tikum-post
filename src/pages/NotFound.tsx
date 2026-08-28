import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-14 text-center">
      <h1 className="heading-hero text-2xl text-ink">Page not found</h1>
      <Link to="/gallery" className="focus-ring rounded-full bg-ink px-6 py-3 text-sm font-medium text-white">
        Back to gallery
      </Link>
    </div>
  )
}
