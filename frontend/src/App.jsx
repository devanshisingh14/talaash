import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from './LoginPage.jsx'
import Layout from './Layout.jsx'
import Dashboard from './Dashboard.jsx'
import CaseForm from './CaseForm.jsx'
import CasesList from './CasesList.jsx'
import ProfilePage from './ProfilePage.jsx'
import HomePage from './HomePage.jsx'
import AIDetectionPage from './AIDetectionPage.jsx'
import UsersPage from './UsersPage.jsx'
import ComingSoon from './ComingSoon.jsx'

const ADMIN_NAV = [
  { to: '/admin/home', label: 'Dashboard' },
  { to: '/admin/cases', label: 'Missing Persons' },
  { to: '/admin/live', label: 'Live CCTV' },
  { to: '/admin/ai-detection', label: 'AI Detection' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/map', label: 'Map View' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/profile', label: 'Profile' },
]

const OFFICER_NAV = [
  { to: '/officer/active-cases', label: 'Active Cases' },
  { to: '/officer/alerts', label: 'AI Alerts' },
  { to: '/officer/report', label: 'Submit Report' },
  { to: '/officer/profile', label: 'Profile' },
]

function CasesPage() {
  return (
    <div className="cases-layout">
      <CaseForm onCreated={() => window.location.reload()} />
      <div>
        <h2>All Cases</h2>
        <CasesList refreshKey={0} />
      </div>
    </div>
  )
}

function RootRedirect() {
  const { user, token, loading } = useAuth()
  if (loading) return <p className="empty" style={{ padding: 24 }}>Loading...</p>
  if (!token || !user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/officer'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Layout navItems={ADMIN_NAV} roleLabel="Admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="live" element={<Dashboard />} />
            <Route path="ai-detection" element={<AIDetectionPage />} />
            <Route path="reports" element={<ComingSoon title="Reports Dashboard" />} />
            <Route path="map" element={<ComingSoon title="Map Tracking Dashboard" />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<ComingSoon title="Analytics Dashboard" />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route
            path="/officer"
            element={
              <ProtectedRoute role="officer">
                <Layout navItems={OFFICER_NAV} roleLabel="Officer" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="active-cases" replace />} />
            <Route path="active-cases" element={<CasesList refreshKey={0} statusFilter="Active" />} />
            <Route path="alerts" element={<Dashboard />} />
            <Route path="report" element={<ComingSoon title="Submit Report Dashboard" />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
