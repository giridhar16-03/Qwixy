import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

function PlannerPage() {
  const { user, userPlans, createPlan, updatePlan, deletePlan, reloadUserPlans } = useUser()
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({ title: '', subject: '', topic: '', slot: '' })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPlans(userPlans || [])
  }, [userPlans])

  const resetForm = () => {
    setForm({ title: '', subject: '', topic: '', slot: '' })
    setEditingId(null)
    setError('')
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Please enter a plan title.')
      return
    }

    const result = editingId
      ? await updatePlan(editingId, { ...form, done: false })
      : await createPlan({ ...form, done: false })

    if (result?.error) {
      setError(result.error.message || 'Failed to save plan.')
      return
    }

    await reloadUserPlans()
    resetForm()
  }

  const handleEdit = (plan) => {
    setForm({
      title: plan.title,
      subject: plan.subject,
      topic: plan.topic,
      slot: plan.slot,
    })
    setEditingId(plan.id)
    setError('')
  }

  const handleDelete = async (id) => {
    const { error: deleteError } = await deletePlan(id)
    if (deleteError) {
      setError(deleteError.message || 'Failed to delete plan.')
      return
    }

    if (editingId === id) resetForm()
  }

  return (
    <AppShell title="Daily Planner" subtitle="Create and edit your personal study plans">
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-900">{editingId ? 'Edit Plan' : 'Create a New Plan'}</h2>
            <p className="mt-1 text-sm text-slate-500">Plans are saved to your account and shown on the dashboard.</p>
          </div>
          <Button onClick={resetForm} variant="secondary" className="h-11">
            Clear
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Enter plan title"
          />
          <Input
            label="Subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="e.g. Mathematics"
          />
          <Input
            label="Topic"
            value={form.topic}
            onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
            placeholder="e.g. Calculus revision"
          />
          <Input
            label="Time Slot"
            value={form.slot}
            onChange={(event) => setForm((prev) => ({ ...prev, slot: event.target.value }))}
            placeholder="e.g. 09:00 AM - 10:30 AM"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSave}>{editingId ? 'Update Plan' : 'Save Plan'}</Button>
          {editingId && (
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Your Saved Plans</h2>
          <span className="text-sm text-slate-500">{plans.length} {plans.length === 1 ? 'plan' : 'plans'}</span>
        </div>

        <div className="mt-5 space-y-3">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-heading">{plan.title}</p>
                    <p className="text-sm text-slate-500">{plan.subject} • {plan.topic}</p>
                    <p className="mt-2 text-sm text-slate-600">{plan.slot}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => handleEdit(plan)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => handleDelete(plan.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No plans yet — create one to start your personalized schedule.</p>
          )}
        </div>
      </Card>
    </AppShell>
  )
}

export default PlannerPage
