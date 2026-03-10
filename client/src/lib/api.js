import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  }
}

async function request(path, options = {}) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Clients
export const getClients = () => request('/api/clients')
export const addClient = (client) => request('/api/clients', { method: 'POST', body: JSON.stringify(client) })
export const updateClient = (id, client) => request(`/api/clients/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(client) })
export const deleteClient = (id) => request(`/api/clients/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const importClients = async (file) => {
  const headers = await getHeaders()
  delete headers['Content-Type']
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}/api/clients/import`, { method: 'POST', headers, body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

// Templates
export const getTemplates = () => request('/api/templates')
export const createTemplate = (t) => request('/api/templates', { method: 'POST', body: JSON.stringify(t) })
export const updateTemplate = (id, t) => request(`/api/templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(t) })
export const deleteTemplate = (id) => request(`/api/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Email
export const sendEmail = (data) => request('/api/email/send', { method: 'POST', body: JSON.stringify(data) })
export const previewEmail = (data) => request('/api/email/preview', { method: 'POST', body: JSON.stringify(data) })
export const getEmailLogs = (params) => {
  const query = new URLSearchParams(params).toString()
  return request(`/api/email/logs${query ? '?' + query : ''}`)
}

// Workflows
export const getWorkflowForms = () => request('/api/workflows/forms')
export const getWorkflowRecipients = (formId) => request(`/api/workflows/forms/${encodeURIComponent(formId)}/recipients`)

// Forms
export const getForms = () => request('/api/forms')
export const createForm = (form) => request('/api/forms', { method: 'POST', body: JSON.stringify(form) })
export const deleteForm = (id) => request(`/api/forms/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Settings
export const getSmtpSettings = () => request('/api/settings/smtp')
export const updateSmtpSettings = (s) => request('/api/settings/smtp', { method: 'PUT', body: JSON.stringify(s) })
export const testSmtpConnection = () => request('/api/settings/smtp/test', { method: 'POST' })
