import { useState, useEffect } from 'react'
import { getWorkflowForms, getWorkflowRecipients } from '../../lib/api'
import {
  ArrowLeft, Mail, FileText, ClipboardCheck, PenTool,
  CheckCircle2, XCircle, Send, Eye, Database, UserCheck,
  ExternalLink, Clock, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const WORKFLOW_STEPS = [
  {
    number: 1,
    title: 'Outbound Lead Email',
    description: 'Team opens the portal, selects an email template, enters customer email, and hits send. Email contains a Tally form link.',
    icon: Send,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    status: 'active',
  },
  {
    number: 2,
    title: 'Customer Intake',
    description: 'Customer clicks the link, fills out the Tally form (contact details, garage door info, problem description, photo uploads), and submits.',
    icon: ClipboardCheck,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    status: 'active',
  },
  {
    number: 3,
    title: 'Data Handling',
    description: 'n8n catches the webhook, stores everything in Supabase (customer info, photos, service type, timestamp), and sends notification to the team.',
    icon: Database,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    status: 'active',
  },
  {
    number: 4,
    title: 'Internal Review + Estimate',
    description: 'Team sees new submission with all data and photos, reviews it, approves or rejects. On approval, selects estimate template and auto-populates with customer data.',
    icon: Eye,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    status: 'coming-soon',
  },
  {
    number: 5,
    title: 'Internal Approval',
    description: 'Team lead reviews the finalized estimate in the portal, signs off, and hits "Send for signature."',
    icon: UserCheck,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    status: 'coming-soon',
  },
  {
    number: 6,
    title: 'Document Sent to Customer',
    description: 'n8n generates the branded PDF, sends it to SignWell via API. SignWell emails the customer a secure signing link for electronic signature.',
    icon: FileText,
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    status: 'coming-soon',
  },
  {
    number: 7,
    title: 'Customer Approves or Declines',
    description: 'If approved: customer signs → SignWell webhook fires → signed PDF + audit trail stored → status updated to "Approved." If declined: follow-up task created.',
    icon: PenTool,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    status: 'coming-soon',
  },
  {
    number: 8,
    title: 'Job Documentation + Storage',
    description: 'Everything lives in Supabase: original intake, photos, generated estimate, signed PDF, audit trail certificate, approval timestamps, full job history.',
    icon: Database,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    status: 'coming-soon',
  },
]

export default function WorkflowPage() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setForms(await getWorkflowForms())
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  const selectForm = async (form) => {
    setSelectedForm(form)
    setSelectedRecipient(null)
    setLoadingRecipients(true)
    try {
      setRecipients(await getWorkflowRecipients(form.id))
    } catch (err) {
      toast.error(err.message)
    }
    setLoadingRecipients(false)
  }

  const goBack = () => {
    if (selectedRecipient) {
      setSelectedRecipient(null)
    } else if (selectedForm) {
      setSelectedForm(null)
      setRecipients([])
    }
  }

  // Determine current step for a recipient based on email status
  const getCurrentStep = (recipient) => {
    if (recipient.status === 'sent') return 2 // Email sent, waiting for intake
    if (recipient.status === 'failed') return 1
    return 1
  }

  // VIEW 1: Form list
  if (!selectedForm) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">Select a form to view its workflow and recipients</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : forms.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No forms yet</p>
            <p className="text-gray-400 text-sm">Add a Tally form in the Forms page to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => selectForm(form)}
                className="card p-5 text-left hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{form.name}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <code className="bg-gray-50 px-2 py-0.5 rounded text-xs font-mono">{form.tally_form_id}</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    form.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{form.status}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Created {new Date(form.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // VIEW 3: Workflow steps for a selected recipient
  if (selectedRecipient) {
    const currentStep = getCurrentStep(selectedRecipient)

    return (
      <div>
        <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to recipients
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Workflow Progress</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>{selectedRecipient.recipient_email}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{selectedRecipient.recipient_name}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-400">{new Date(selectedRecipient.sent_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Status bar */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm text-gray-500">Step {currentStep} of {WORKFLOW_STEPS.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / WORKFLOW_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Workflow steps timeline */}
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep
            const isComingSoon = step.status === 'coming-soon'

            return (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className={`absolute left-6 top-16 w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}

                <div className={`card p-5 border-l-4 transition-all duration-200 ${
                  isCompleted
                    ? 'border-l-green-500 bg-green-50/30'
                    : isCurrent
                      ? `border-l-4 ${step.borderColor} ${step.lightColor}`
                      : isComingSoon
                        ? 'border-l-gray-200 bg-gray-50/50 opacity-60'
                        : 'border-l-gray-200'
                }`}>
                  <div className="flex items-start gap-4">
                    {/* Step icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-green-500' : isCurrent ? step.color : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-green-600' : isCurrent ? step.textColor : 'text-gray-400'
                        }`}>
                          Step {step.number}
                        </span>
                        {isCompleted && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Completed</span>
                        )}
                        {isCurrent && (
                          <span className={`text-xs px-2 py-0.5 ${step.lightColor} ${step.textColor} rounded-full font-medium`}>In Progress</span>
                        )}
                        {isComingSoon && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Coming Soon</span>
                        )}
                      </div>
                      <h3 className={`font-semibold text-lg ${
                        isCompleted ? 'text-green-800' : isCurrent ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        isCompleted ? 'text-green-600' : isCurrent ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // VIEW 2: Recipients list for selected form
  return (
    <div>
      <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to forms
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{selectedForm.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500">{recipients.length} recipients</p>
            <a
              href={selectedForm.tally_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Form
            </a>
          </div>
        </div>
      </div>

      {loadingRecipients ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : recipients.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No recipients yet</p>
          <p className="text-gray-400 text-sm">Send an email using a template linked to this form to see recipients here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipients.map((r, idx) => (
            <button
              key={`${r.id}-${idx}`}
              onClick={() => setSelectedRecipient(r)}
              className="card p-4 w-full text-left hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary-700">
                    {(r.recipient_name || r.recipient_email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{r.recipient_name || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'sent' ? 'bg-green-50 text-green-700' :
                      r.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="truncate">{r.recipient_email}</span>
                  </div>
                </div>

                {/* Date & arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(r.sent_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(r.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
