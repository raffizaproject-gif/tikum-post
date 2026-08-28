import { Navigate } from 'react-router-dom'

// The brief treats the gallery as the site's primary landing experience,
// mirroring the reference design. Home simply routes there.
export default function Home() {
  return <Navigate to="/gallery" replace />
}
