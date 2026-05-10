import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, MessageSquare } from 'lucide-react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

function DashboardPage() {
  const { user, userProfile, userPlans, createPlan, updatePlan, deletePlan, getAssistantMessages, sendToQwixy, loading } = useUser()
  const navigate = useNavigate()
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [form, setForm] = useState({ title: '', subject: '', topic: '', slot: '' })
  const [formError, setFormError] = useState('')
  const [isLoadingPlans, setIsLoadingPlans] = useState(loading)
  const [togglingPlanId, setTogglingPlanId] = useState(null)
  const [updateError, setUpdateError] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState([])
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantError, setAssistantError] = useState('')
  const [assistantSending, setAssistantSending] = useState(false)
  const [assistantLoaded, setAssistantLoaded] = useState(false)

  useEffect(() => {
    if (!loading && user && !userProfile?.isProfileComplete) {
      navigate('/profile-setup', { replace: true })
    }
  }, [loading, navigate, user, userProfile])

  useEffect(() => {
    // Update task loading state when data finishes loading
    setIsLoadingPlans(loading)
  }, [loading])

  useEffect(() => {
    const loadAssistantHistory = async () => {
      if (!assistantOpen || assistantLoaded) return

      try {
        const msgs = await getAssistantMessages(8)
        setAssistantMessages(msgs || [])
        setAssistantLoaded(true)
      } catch (err) {
        console.error('Failed to load assistant messages:', err)
        setAssistantError('Could not load Qwixy history.')
      }
    }

    loadAssistantHistory()
  }, [assistantLoaded, assistantOpen, getAssistantMessages])

  // Show loading screen while fetching data from database
  if (!user) {
    return (
      <AppShell
        title="Loading your dashboard..."
        subtitle="Retrieving your profile and tasks from the database"
      >
        <div className="mx-auto w-full max-w-5xl">
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-slate-600">Loading your data from database...</p>
          </Card>
        </div>
      </AppShell>
    )
  }

  const resetForm = () => {
    setForm({ title: '', subject: '', topic: '', slot: '' })
    setEditingPlanId(null)
    setFormError('')
  }

  const handleQuickSave = async () => {
    if (!form.title.trim()) {
      setFormError('Please enter a title for the task.')
      return
    }

    const currentPlan = (userPlans || []).find((plan) => plan.id === editingPlanId)
    const result = editingPlanId
      ? await updatePlan(editingPlanId, { ...form, done: currentPlan?.done || false })
      : await createPlan({ ...form, done: false })

    if (result?.error) {
      setFormError(result.error.message || 'Failed to save task.')
      return
    }

    resetForm()
    setIsQuickCreateOpen(false)
  }

  const handleEditPlan = (plan) => {
    setForm({
      title: plan.title || '',
      subject: plan.subject || '',
      topic: plan.topic || '',
      slot: plan.slot || '',
    })
    setEditingPlanId(plan.id)
    setFormError('')
    setIsQuickCreateOpen(true)
  }

  const handleToggleDone = async (plan) => {
    console.log('🔄 Toggling task completion:', plan.id, 'current done:', plan.done)
    setTogglingPlanId(plan.id)
    setUpdateError('')
    
    const result = await updatePlan(plan.id, {
      title: plan.title,
      subject: plan.subject,
      topic: plan.topic,
      slot: plan.slot,
      done: !plan.done,
    })
    
    setTogglingPlanId(null)
    
    console.log('✅ Toggle result:', result)
    if (result?.error) {
      console.error('❌ Toggle failed:', result.error)
      setUpdateError(`Failed to update task: ${result.error.message}`)
      setTimeout(() => setUpdateError(''), 5000)
    } else {
      console.log('✅ Task updated successfully!')
    }
  }

  const handleDeletePlan = async (id) => {
    const { error } = await deletePlan(id)
    if (error) {
      console.error('Delete failed:', error)
      return
    }
    if (editingPlanId === id) {
      resetForm()
    }
  }

  const handleOpenAssistant = () => {
    setAssistantOpen(true)
    setAssistantError('')
  }

  const handleCloseAssistant = () => {
    setAssistantOpen(false)
  }

  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) return

    const prompt = assistantInput.trim()
    setAssistantSending(true)
    setAssistantError('')

    try {
      const nextMessages = [...assistantMessages, { role: 'user', content: prompt }].slice(-10)
      setAssistantMessages(nextMessages)
      setAssistantInput('')

      const reply = await sendToQwixy(prompt)
      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: reply }].slice(-10))
    } catch (err) {
      console.error('Assistant send failed:', err)
      setAssistantError(err.message || 'Failed to send message.')
    } finally {
      setAssistantSending(false)
    }
  }

  const totalPlans = userPlans.length
  const completedPlans = userPlans.filter((plan) => plan.done).length
  const pendingPlans = totalPlans - completedPlans

  return (
    <AppShell
      title={`Good morning, ${userProfile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}!`}
      subtitle="A minimal dashboard for creating and tracking your study tasks"
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {updateError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="text-sm font-medium">⚠️ {updateError}</p>
          </div>
        )}
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-6">
            <div>
              <h2 className="font-heading text-xl font-semibold text-slate-900">Saved tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Everything here is linked to your account.</p>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setIsQuickCreateOpen((prev) => !prev)
              }}
              className="inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create task
            </Button>
          </div>

          <div className="grid gap-3 border-b border-slate-200 p-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totalPlans}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingPlans}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completedPlans}</p>
            </div>
          </div>

          {isQuickCreateOpen && (
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-slate-900">{editingPlanId ? 'Edit task' : 'Create task'}</h3>
                  <p className="text-sm text-slate-500">Minimal form, instant save.</p>
                </div>
                <Button variant="secondary" onClick={resetForm}>Clear</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Title"
                  value={form.title}
                  error={formError}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Example: Revise Biology"
                />
                <Input
                  label="Subject"
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Example: Biology"
                />
                <Input
                  label="Topic"
                  value={form.topic}
                  onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
                  placeholder="Example: Photosynthesis"
                />
                <Input
                  label="Time slot"
                  value={form.slot}
                  onChange={(event) => setForm((prev) => ({ ...prev, slot: event.target.value }))}
                  placeholder="Example: 6:00 PM - 7:00 PM"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleQuickSave} className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  {editingPlanId ? 'Update task' : 'Save task'}
                </Button>
                {editingPlanId && (
                  <Button variant="secondary" onClick={resetForm}>
                    Cancel edit
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-heading text-lg font-semibold text-slate-900">Task list</h3>
              <span className="text-sm text-slate-500">{userPlans.length} {userPlans.length === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="mt-5 grid gap-3">
              {isLoadingPlans ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-sm text-slate-600">Loading your tasks from database...</p>
                </div>
              ) : userPlans.length > 0 ? (
                userPlans.map((plan) => (
                  <div key={plan.id} className={`rounded-2xl border px-4 py-3 transition-all ${plan.done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleDone(plan)
                          }}
                          disabled={togglingPlanId === plan.id}
                          className={`flex-shrink-0 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded ${
                            togglingPlanId === plan.id 
                              ? 'opacity-50 cursor-wait' 
                              : 'text-slate-400 hover:text-primary'
                          }`}
                          title={plan.done ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {togglingPlanId === plan.id ? (
                            <div className="animate-spin">
                              <Circle size={20} className="text-slate-300" />
                            </div>
                          ) : plan.done ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <Circle size={20} className="text-slate-300" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${plan.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{plan.title}</p>
                            {plan.done && <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Completed</span>}
                          </div>
                          <p className={`text-xs ${plan.done ? 'text-slate-400 line-through' : 'text-slate-500'}`}>{plan.subject || 'General'} {plan.topic ? `• ${plan.topic}` : ''} {plan.slot ? `• ${plan.slot}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => handleEditPlan(plan)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-semibold text-slate-900">No saved tasks yet</p>
                  <p className="mt-1 text-sm text-slate-500">Use the Create task button to add your first plan.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <button
        type="button"
        onClick={handleOpenAssistant}
        aria-label="Open Qwixy AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition hover:scale-105 hover:bg-primaryDark focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <MessageSquare size={22} />
      </button>

      {assistantOpen && (
        <div className="fixed inset-0 z-50 lg:pointer-events-none">
          <button
            type="button"
            aria-label="Close assistant panel"
            onClick={handleCloseAssistant}
            className="absolute inset-0 bg-black/10 lg:pointer-events-auto"
          />

          <aside className="absolute inset-y-4 right-4 left-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:pointer-events-auto lg:left-auto lg:w-[380px]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Qwixy AI</p>
                <h3 className="font-heading text-lg font-semibold text-slate-900">Quick Assistant</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAssistant}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="flex h-[calc(100%-57px)] flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {assistantMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Ask Qwixy AI anything about your study tasks.
                    </div>
                  ) : (
                    assistantMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-6 ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {assistantError && <div className="border-t border-slate-200 px-4 py-2 text-xs text-rose-600">{assistantError}</div>}

              <div className="border-t border-slate-200 p-3">
                <div className="space-y-3">
                  <textarea
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="Ask Qwixy AI..."
                    className="min-h-[88px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {['Plan my week', 'Explain a topic simply'].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setAssistantInput(prompt)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500 transition hover:border-primary/30 hover:text-slate-700"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={handleAssistantSend}
                      disabled={assistantSending || !assistantInput.trim()}
                      className="h-9 shrink-0 border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-100"
                    >
                      {assistantSending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  )
}

export default DashboardPage
