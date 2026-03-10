import { useState, useEffect, useRef } from 'react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../lib/api'
import { Plus, Pencil, Trash2, Copy, X, Eye, Code } from 'lucide-react'
import toast from 'react-hot-toast'

function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState(template || { name: '', subject: '', body: '', formstack_url: '' })
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const sampleData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    company: 'Acme Inc'
  }

  const sampleFormstackUrl = form.formstack_url || 'https://formstack.com/your-form'
  const formstackButtonHtml = `<a href="${sampleFormstackUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;margin:8px 4px;">Fill Out the Form</a>`

  let previewBody = form.body
    .replace(/\{\{first_name\}\}/g, sampleData.first_name)
    .replace(/\{\{last_name\}\}/g, sampleData.last_name)
    .replace(/\{\{email\}\}/g, sampleData.email)
    .replace(/\{\{company\}\}/g, sampleData.company)
    .replace(/\{\{formstack_link\}\}/g, formstackButtonHtml)

  if (!previewBody.trim().startsWith('<')) {
    previewBody = previewBody.replace(/\n/g, '<br>')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const insertPlaceholder = (ph) => {
    setForm({ ...form, body: form.body + `{{${ph}}}` })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="card p-6 w-full max-w-3xl relative z-10 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Template Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Email" required />
          </div>

          <div>
            <label className="label">Subject Line</label>
            <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Welcome, {{first_name}}!" required />
          </div>

          <div>
            <label className="label">Formstack Link (Optional)</label>
            <input
              className="input"
              value={form.formstack_url || ''}
              onChange={e => setForm({ ...form, formstack_url: e.target.value })}
              placeholder="https://formstack.com/forms/your-form"
              type="url"
            />
            <p className="text-xs text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{{formstack_link}}'}</code> in the body to insert this URL</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-600">Body (HTML)</label>
              <div className="flex gap-2">
                {['first_name', 'last_name', 'email', 'company', 'formstack_link'].map(ph => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => insertPlaceholder(ph)}
                    className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    {`{{${ph}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="input min-h-[240px] font-mono text-sm"
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="<h1>Hello {{first_name}},</h1><p>Welcome to our platform!</p>"
              required
            />
          </div>

          {/* Preview toggle */}
          <div>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
              {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Show Code' : 'Preview with Sample Data'}
            </button>
            {showPreview && (
              <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl">
                <div className="text-sm text-gray-500 mb-2">
                  <strong>Subject:</strong> {form.subject
                    .replace(/\{\{first_name\}\}/g, sampleData.first_name)
                    .replace(/\{\{last_name\}\}/g, sampleData.last_name)
                    .replace(/\{\{email\}\}/g, sampleData.email)
                    .replace(/\{\{company\}\}/g, sampleData.company)
                    .replace(/\{\{formstack_link\}\}/g, sampleFormstackUrl)}
                </div>
                <div className="border-t border-gray-100 pt-3" dangerouslySetInnerHTML={{ __html: previewBody }} />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : template ? 'Update' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TemplateList() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(undefined)

  const load = async () => {
    try {
      setTemplates(await getTemplates())
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (form.id) {
      await updateTemplate(form.id, form)
      toast.success('Template updated')
    } else {
      await createTemplate(form)
      toast.success('Template created')
    }
    load()
  }

  const handleDuplicate = async (t) => {
    try {
      await createTemplate({ name: `${t.name} (Copy)`, subject: t.subject, body: t.body, formstack_url: t.formstack_url })
      toast.success('Template duplicated')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await deleteTemplate(id)
      toast.success('Template deleted')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">{templates.length} email templates</p>
        </div>
        <button onClick={() => setModal(null)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          No templates yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="card p-5 hover:shadow-md transition-shadow duration-300 flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{t.name}</h3>
              <p className="text-sm text-gray-500 mb-3 truncate">Subject: {t.subject}</p>
              <div className="text-xs text-gray-400 mt-auto mb-3">
                Updated {new Date(t.updated_at).toLocaleDateString()}
              </div>
              <div className="flex gap-1 border-t border-gray-50 pt-3">
                <button onClick={() => setModal(t)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDuplicate(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== undefined && (
        <TemplateModal
          template={modal}
          onClose={() => setModal(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
