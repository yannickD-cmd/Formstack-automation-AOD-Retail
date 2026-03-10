import { useEffect, useState } from 'react'
import { Users, FileText, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { getClients } from '../lib/api'
import { getTemplates } from '../lib/api'
import { getEmailLogs } from '../lib/api'

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    indigo: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    templates: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    total: 0,
  })
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [clients, templates, logs] = await Promise.all([
          getClients(),
          getTemplates(),
          getEmailLogs()
        ])
        setStats({
          clients: clients.length,
          templates: templates.length,
          sent: logs.filter(l => l.status === 'sent').length,
          failed: logs.filter(l => l.status === 'failed').length,
          pending: logs.filter(l => l.status === 'pending').length,
          total: logs.length,
        })
        setRecentLogs(logs.slice(0, 8))
      } catch {
        // Silently handle — user may be first logging in
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your email system</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Total Clients" value={stats.clients} color="indigo" />
        <StatCard icon={FileText} label="Templates" value={stats.templates} color="violet" />
        <StatCard icon={Send} label="Emails Sent" value={stats.sent} color="emerald" />
        <StatCard icon={AlertCircle} label="Failed" value={stats.failed} color="red" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="amber" />
        <StatCard icon={CheckCircle} label="Total Logs" value={stats.total} color="blue" />
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Send className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No emails sent yet. Start by creating a template!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLogs.map(log => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{log.recipient_name || log.recipient_email}</div>
                  <div className="text-sm text-gray-500 truncate">{log.subject}</div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`badge-${log.status}`}>{log.status}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.sent_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
