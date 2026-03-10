import React, { useState, useEffect } from 'react'
import { getEmailLogs } from '../../lib/api'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailLogList() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      setLogs(await getEmailLogs(params))
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter, dateFrom, dateTo])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
        <p className="text-gray-500 mt-1">Full history of sent emails</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              className="input text-sm py-2"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input type="date" className="input text-sm py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input type="date" className="input text-sm py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo('') }}
              className="text-sm text-primary-600 hover:text-primary-700 mt-4"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No email logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{log.recipient_name || '—'}</div>
                        <div className="text-xs text-gray-500">{log.recipient_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`badge-${log.status}`}>{log.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={5} className="px-6 py-4 bg-surface-50">
                          {log.error_message && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                              <strong>Error:</strong> {log.error_message}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mb-2">Email Content:</div>
                          <div className="p-4 bg-white rounded-xl border border-gray-100 text-sm" dangerouslySetInnerHTML={{ __html: log.body }} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
