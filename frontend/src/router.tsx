import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

/** Redirect to /chat but keep ?code=...&state=... so Auth0 callback can finish before ProtectedRoute runs */
function DefaultRedirect() {
  const location = useLocation()
  const to = `/chat${location.search}`
  return <Navigate to={to} replace />
}

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute roles={['admin', 'partner', 'associate', 'paralegal']}>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={['admin']}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  </BrowserRouter>
)

