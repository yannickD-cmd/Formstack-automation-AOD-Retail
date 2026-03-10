import { useState, useEffect } from 'react'
import { getTemplates, getClients, sendEmail, previewEmail } from '../../lib/api'
import { Send, Eye, CheckCircle, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SendEmailPage() {
  const [templates, setTemplates] = useState([])
  const [clients, setClients] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedClients, setSelectedClients] = useState([])
  const [preview, setPreview] = useState(null)
  const [sending, setSending] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTemplates(), getClients()]).then(([t, c]) => {
      setTemplates(t)
      setClients(c)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggleClient = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const filteredIds = filteredClients.map(c => c.id)
    const allSelected = filteredIds.every(id => selectedClients.includes(id))
    if (allSelected) {
      setSelectedClients(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      setSelectedClients(prev => [...new Set([...prev, ...filteredIds])])
    }
  }

  const handlePreview = async () => {
    if (!selectedTemplate) return toast.error('Select a template')
    try {
      const data = await previewEmail({
        template_id: selectedTemplate,
        client_id: selectedClients[0] || null
      })
      setPreview(data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSend = async () => {
    if (!selectedTemplate) return toast.error('Select a template')
    if (!selectedClients.length) return toast.error('Select at least one client')

    setSending(true)
    try {
      const { results } = await sendEmail({
        template_id: selectedTemplate,
        client_ids: selectedClients
      })
      const sent = results.filter(r => r.status === 'sent').length
      const failed = results.filter(r => r.status === 'failed').length
      if (sent > 0) toast.success(`${sent} email(s) sent successfully`)
      if (failed > 0) toast.error(`${failed} email(s) failed`)
      setSelectedClients([])
      setSelectedTemplate('')
      setPreview(null)
    } catch (err) {
      toast.error(err.message)
    }
    setSending(false)
  }

  const filteredClients = clients.filter(c => {
    const q = clientSearch.toLowerCase()
    return !q ||
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
  })

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
        <h1 className="text-2xl font-bold text-gray-900">Send Email</h1>
        <p className="text-gray-500 mt-1">Select a template, pick recipients, and send</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Template */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs flex items-center justify-center font-bold">1</span>
            Choose Template
          </h3>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-400">No templates. Create one first.</p>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedTemplate === t.id
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{t.subject}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Clients */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs flex items-center justify-center font-bold">2</span>
            Select Recipients
            {selectedClients.length > 0 && (
              <span className="ml-auto badge bg-primary-50 text-primary-700">{selectedClients.length} selected</span>
            )}
          </h3>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Search clients..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
            />
          </div>

          {filteredClients.length > 0 && (
            <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-700 mb-2">
              {filteredClients.every(c => selectedClients.includes(c.id)) ? 'Deselect all' : 'Select all'}
            </button>
          )}

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredClients.map(c => (
              <button
                key={c.id}
                onClick={() => toggleClient(c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                  selectedClients.includes(c.id)
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  selectedClients.includes(c.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}>
                  {selectedClients.includes(c.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.first_name} {c.last_name}</div>
                  <div className="text-xs text-gray-500 truncate">{c.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Preview & Send */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs flex items-center justify-center font-bold">3</span>
            Preview & Send
          </h3>

          <div className="space-y-3 mb-6">
            <button onClick={handlePreview} disabled={!selectedTemplate} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Email
            </button>
            <button onClick={handleSend} disabled={sending || !selectedTemplate || !selectedClients.length} className="btn-primary w-full flex items-center justify-center gap-2">
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {selectedClients.length} recipient{selectedClients.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {preview && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Email Preview</span>
                <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="text-sm mb-2"><strong>Subject:</strong> {preview.subject}</div>
                <div className="border-t border-gray-100 pt-3 text-sm" dangerouslySetInnerHTML={{ __html: preview.body }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
