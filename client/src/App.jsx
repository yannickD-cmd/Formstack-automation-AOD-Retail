import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './components/Auth/LoginPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import DashboardLayout from './components/Layout/DashboardLayout'
import Dashboard from './components/Dashboard'
import ClientList from './components/Clients/ClientList'
import TemplateList from './components/Templates/TemplateList'
import SendEmailPage from './components/SendEmail/SendEmailPage'
import EmailLogList from './components/Logs/EmailLogList'
import SmtpSettings from './components/Settings/SmtpSettings'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
      <Route element={<ProtectedRoute session={session} />}>
        <Route element={<DashboardLayout session={session} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/send" element={<SendEmailPage />} />
          <Route path="/logs" element={<EmailLogList />} />
          <Route path="/settings" element={<SmtpSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}
