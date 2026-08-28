import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Checking session..." />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
