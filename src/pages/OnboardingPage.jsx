import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'

const steps = [
  { key: 'subjects', label: 'Subjects' },
  { key: 'goal', label: 'Daily Goal' },
  { key: 'availability', label: 'Availability' },
]

function OnboardingPage() {
  const [current, setCurrent] = useState(0)
  const [state, setState] = useState({ subjects: '', goal: '', availability: '' })
  const navigate = useNavigate()

  const nextStep = () => (current < 2 ? setCurrent((prev) => prev + 1) : navigate('/dashboard'))
  const prevStep = () => setCurrent((prev) => Math.max(prev - 1, 0))

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <Card className="w-full max-w-xl p-8 bg-white border border-slate-200">
        <h1 className="font-heading text-3xl font-bold text-heading">Set up your study plan</h1>
        <div className="mt-4 flex items-center gap-3">
          {steps.map((step, index) => (
            <div key={step.key} className={`h-2 flex-1 rounded-full ${index <= current ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </div>
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-6">
          {current === 0 && (
            <Input
              label="Subjects (comma separated)"
              placeholder="Math, Physics, Chemistry"
              value={state.subjects}
              onChange={(event) => setState((prev) => ({ ...prev, subjects: event.target.value }))}
            />
          )}
          {current === 1 && (
            <Input
              label="Daily Study Goal"
              placeholder="e.g. 4 hours daily"
              value={state.goal}
              onChange={(event) => setState((prev) => ({ ...prev, goal: event.target.value }))}
            />
          )}
          {current === 2 && (
            <Input
              label="Availability"
              placeholder="e.g. 7 AM - 9 PM"
              value={state.availability}
              onChange={(event) => setState((prev) => ({ ...prev, availability: event.target.value }))}
            />
          )}
        </motion.div>
        <div className="mt-7 flex justify-between">
          <Button onClick={prevStep} variant="secondary" disabled={current === 0}>
            Back
          </Button>
          <Button onClick={nextStep}>{current === 2 ? 'Finish' : 'Next'}</Button>
        </div>
      </Card>
    </div>
  )
}

export default OnboardingPage
