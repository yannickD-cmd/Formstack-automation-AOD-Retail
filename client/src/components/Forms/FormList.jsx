import { useState, useEffect } from 'react'
import { getForms, createForm, deleteForm } from '../../lib/api'
import { Plus, Trash2, X, ExternalLink, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

function AddFormModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', tally_url: '' })
  const [saving, setSaving] = useState(false)

  const extractId = (url) => {
    const segments = url.replace(/\/+$/, '').split('/')
    return segments[segments.length - 1] || ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const tallyId = extractId(form.tally_url)
    if (!tallyId) {
      toast.error('Could not extract form ID from URL')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="card p-6 w-full max-w-lg relative z-10 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Tally Form</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Form Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Customer Intake Form"
              required
            />
          </div>

          <div>
            <label className="label">Tally Form URL</label>
            <input
              className="input"
              value={form.tally_url}
              onChange={e => setForm({ ...form, tally_url: e.target.value })}
              placeholder="https://tally.so/r/jaMzzY"
              required
            />
            {form.tally_url && (
              <p className="text-xs text-gray-400 mt-1">
                Form ID: <span className="font-mono text-primary-600">{extractId(form.tally_url)}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FormList() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    try {
      setForms(await getForms())
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    await createForm(form)
    toast.success('Form added & webhook triggered')
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this form?')) return
    try {
      await deleteForm(id)
      toast.success('Form deleted')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-500 mt-1">{forms.length} Tally forms</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Form
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No forms yet</p>
          <p className="text-gray-400 text-sm">Add a Tally form URL to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <div key={f.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate pr-2">{f.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  f.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {f.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-600">ID:</span>
                  <code className="bg-gray-50 px-2 py-0.5 rounded text-xs font-mono">{f.tally_form_id}</code>
                  <button
                    onClick={() => copyToClipboard(f.tally_form_id, f.id)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {copiedId === f.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Added {new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <a
                  href={f.tally_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Form
                </a>
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddFormModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
