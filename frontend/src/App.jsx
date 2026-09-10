import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminPackages from './pages/AdminPackages'
import AdminPayments from './pages/AdminPayments'
import ProtectedRoute from './components/ProtectedRoute'

function LoginRedirect() {
  const location = useLocation()
  return <Navigate to={`/login${location.search}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default entry goes straight to Login (preserving any MikroTik query params) */}
        <Route path="/" element={<LoginRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Admin workspace routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
        </Route>

        {/* Any unknown route redirects to Login */}
        <Route path="*" element={<LoginRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

