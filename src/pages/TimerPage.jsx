import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

const STORAGE_KEYS = {
  mode: 'timerMode',
  customMinutes: 'timerCustomMinutes',
  seconds: 'timerSeconds',
  running: 'timerRunning',
  deadline: 'timerDeadline',
}

const TIMER_MODES = [
  { id: 'focus', label: 'Focus', minutes: 15 },
  { id: 'steady', label: 'Steady', minutes: 25 },
  { id: 'deep', label: 'Deep', minutes: 45 },
  { id: 'custom', label: 'Custom', minutes: null },
]

const DEFAULT_MODE = 'steady'
const DEFAULT_CUSTOM_MINUTES = 30

const clampMinutes = (value) => Math.min(180, Math.max(1, value))

const getModeMinutes = (mode, customMinutes) => {
  if (mode === 'custom') return clampMinutes(customMinutes)
  return TIMER_MODES.find((option) => option.id === mode)?.minutes ?? 25
}

const readInitialState = () => {
  const storedMode = localStorage.getItem(STORAGE_KEYS.mode) || DEFAULT_MODE
  const storedCustomMinutes = Number.parseInt(localStorage.getItem(STORAGE_KEYS.customMinutes) || '', 10)
  const customMinutes = Number.isFinite(storedCustomMinutes) ? clampMinutes(storedCustomMinutes) : DEFAULT_CUSTOM_MINUTES

  const mode = TIMER_MODES.some((option) => option.id === storedMode) ? storedMode : DEFAULT_MODE
  const minutes = getModeMinutes(mode, customMinutes)
  const storedRunning = localStorage.getItem(STORAGE_KEYS.running) === 'true'
  const storedDeadline = Number.parseInt(localStorage.getItem(STORAGE_KEYS.deadline) || '', 10)
  const storedSeconds = Number.parseInt(localStorage.getItem(STORAGE_KEYS.seconds) || '', 10)

  if (storedRunning && Number.isFinite(storedDeadline)) {
    const remaining = Math.max(0, Math.ceil((storedDeadline - Date.now()) / 1000))
    if (remaining > 0) {
      return {
        mode,
        customMinutes,
        seconds: remaining,
        running: true,
        deadline: storedDeadline,
      }
    }
  }

  const seconds = Number.isFinite(storedSeconds) ? Math.max(0, storedSeconds) : minutes * 60

  return {
    mode,
    customMinutes,
    seconds,
    running: false,
    deadline: null,
  }
}

function TimerPage() {
  const [{ mode, customMinutes, seconds, running, deadline }, setTimerState] = useState(readInitialState)

  useEffect(() => {
    if (!running || !deadline) return undefined

    const syncRemaining = () => {
      const nextSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      if (nextSeconds <= 0) {
        setTimerState((prev) => ({ ...prev, seconds: 0, running: false, deadline: null }))
        return
      }

      setTimerState((prev) => (prev.seconds === nextSeconds ? prev : { ...prev, seconds: nextSeconds }))
    }

    syncRemaining()
    const interval = setInterval(syncRemaining, 1000)
    return () => clearInterval(interval)
  }, [running, deadline])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mode, mode)
    localStorage.setItem(STORAGE_KEYS.customMinutes, String(customMinutes))
    localStorage.setItem(STORAGE_KEYS.seconds, String(seconds))
    localStorage.setItem(STORAGE_KEYS.running, String(running))

    if (running && deadline) {
      localStorage.setItem(STORAGE_KEYS.deadline, String(deadline))
    } else {
      localStorage.removeItem(STORAGE_KEYS.deadline)
    }
  }, [customMinutes, deadline, mode, running, seconds])

  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  const sessionMinutes = getModeMinutes(mode, customMinutes)
  const sessionSeconds = sessionMinutes * 60
  const progress = sessionSeconds > 0 ? ((sessionSeconds - seconds) / sessionSeconds) * 100 : 0

  const applyMode = (nextMode) => {
    const nextMinutes = getModeMinutes(nextMode, customMinutes)
    setTimerState({
      mode: nextMode,
      customMinutes,
      seconds: nextMinutes * 60,
      running: false,
      deadline: null,
    })
  }

  const handleCustomMinutesChange = (event) => {
    const parsed = Number.parseInt(event.target.value, 10)
    const nextMinutes = Number.isFinite(parsed) ? clampMinutes(parsed) : DEFAULT_CUSTOM_MINUTES

    setTimerState({
      mode: 'custom',
      customMinutes: nextMinutes,
      seconds: nextMinutes * 60,
      running: false,
      deadline: null,
    })
  }

  const handleStartPause = () => {
    if (running) {
      setTimerState((prev) => ({
        ...prev,
        running: false,
        deadline: null,
      }))
      return
    }

    setTimerState((prev) => ({
      ...prev,
      running: true,
      deadline: Date.now() + prev.seconds * 1000,
    }))
  }

  const handleReset = () => {
    const nextMinutes = getModeMinutes(mode, customMinutes)
    setTimerState((prev) => ({
      ...prev,
      seconds: nextMinutes * 60,
      running: false,
      deadline: null,
    }))
  }

  return (
    <AppShell title="Focus Timer" subtitle="A calm, minimal space for deep work sessions">
      <Card className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {mode === 'custom' ? `${customMinutes} minute session` : `${sessionMinutes} minute session`}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {TIMER_MODES.map((option) => (
            <Button
              key={option.id}
              variant={mode === option.id ? 'primary' : 'secondary'}
              className="px-4 py-2 text-sm"
              onClick={() => applyMode(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {mode === 'custom' && (
          <div className="mt-5 w-full max-w-xs">
            <Input
              label="Enter custom minutes"
              type="number"
              min="1"
              max="180"
              step="1"
              inputMode="numeric"
              placeholder="Type a duration"
              value={customMinutes}
              onChange={handleCustomMinutesChange}
            />
            <p className="mt-2 text-xs text-slate-400">Type any minute value from 1 to 180. The timer updates from your entry.</p>
          </div>
        )}

        <div className="mt-8 flex h-56 w-56 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border border-slate-100 bg-white">
            <p className="font-heading text-6xl font-semibold tracking-tight text-slate-900">
              {String(minutes).padStart(2, '0')}:{String(remaining).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="mt-8 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {running ? 'Stay with the task in front of you.' : 'Adjust the mode, then start when ready.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={handleStartPause} className="min-w-28">
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={handleReset} className="min-w-28">
            Reset
          </Button>
        </div>
      </Card>
    </AppShell>
  )
}

export default TimerPage
