import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute({ adminOnly = false }) {
  const location = useLocation()
  const token = localStorage.getItem('wifi_portal_token')
  const userStr = localStorage.getItem('wifi_portal_user')
  const user = userStr ? JSON.parse(userStr) : null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
