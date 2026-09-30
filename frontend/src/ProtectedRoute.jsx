import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function ProtectedRoute({ role, children }) {
  const { user, token, loading } = useAuth()

  if (loading) return <p className="empty" style={{ padding: 24 }}>Loading...</p>
  if (!token || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />

  return children
}
