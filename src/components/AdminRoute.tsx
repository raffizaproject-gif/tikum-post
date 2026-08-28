import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <LoadingSpinner label="Checking permissions..." />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />
  return children
}
