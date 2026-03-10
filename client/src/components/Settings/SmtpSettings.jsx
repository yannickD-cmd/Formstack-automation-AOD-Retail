import { useState, useEffect } from 'react'
import { getSmtpSettings, updateSmtpSettings, testSmtpConnection } from '../../lib/api'
import { Server, Send, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SmtpSettings() {
  const [form, setForm] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    sender_name: '',
    sender_email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    getSmtpSettings()
      .then(data => {
        if (data) {
          setForm({
            host: data.host,
            port: data.port,
            username: data.username,
            password: '',
            sender_name: data.sender_name,
            sender_email: data.sender_email,
          })
          setConfigured(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.password && !configured) {
      return toast.error('Password is required')
    }
    setSaving(true)
    try {
      await updateSmtpSettings(form)
      toast.success('SMTP settings saved')
      setConfigured(true)
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await testSmtpConnection()
      toast.success(result.message)
    } catch (err) {
      toast.error(err.message)
    }
    setTesting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMTP Settings</h1>
        <p className="text-gray-500 mt-1">Configure your Google Workspace email connection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">SMTP Host</label>
                <input className="input" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} required />
              </div>
              <div>
                <label className="label">Port</label>
                <input type="number" className="input" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 587 })} required />
              </div>
            </div>

            <div>
              <label className="label">SMTP Username (email)</label>
              <input type="email" className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="you@yourdomain.com" required />
            </div>

            <div>
              <label className="label">SMTP Password / App Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={configured ? '••••••••  (leave blank to keep current)' : 'Your 16-char app password'}
                required={!configured}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Sender Name</label>
                <input className="input" value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} placeholder="My Company" required />
              </div>
              <div>
                <label className="label">Sender Email</label>
                <input type="email" className="input" value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} placeholder="noreply@yourdomain.com" required />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {configured && (
                <button type="button" onClick={handleTest} disabled={testing} className="btn-secondary flex items-center gap-2">
                  {testing ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Test Connection
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help card */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Server className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Google Workspace</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Host: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">smtp.gmail.com</code></span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Port: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">587</code> (STARTTLS)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Use a 16-char App Password</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">How to get an App Password</h4>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Go to Google Account → Security</li>
                  <li>Enable 2-Step Verification</li>
                  <li>Go to App Passwords</li>
                  <li>Generate for "Mail → Other"</li>
                  <li>Use the 16-char password here</li>
                </ol>
              </div>
            </div>
          </div>

          {configured && (
            <div className="card p-5 bg-emerald-50 border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-5 h-5" />
                SMTP Configured
              </div>
              <p className="text-xs text-emerald-600 mt-1">Your SMTP connection is set up. Use "Test Connection" to verify.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
