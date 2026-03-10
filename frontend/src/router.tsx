import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { AuditLogsPage } from './pages/AuditLogsPage'

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/audit-logs" element={<AuditLogsPage />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  </BrowserRouter>
)

