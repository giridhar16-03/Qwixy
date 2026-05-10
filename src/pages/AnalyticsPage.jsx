import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import { useUser } from '../contexts/UserContext'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement)

const DAY_MS = 24 * 60 * 60 * 1000

const formatDayLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'short' })

const formatWeekLabel = (date) => `W${Math.ceil((date.getDate() + 6) / 7)}`

const toDateKey = (date) => date.toISOString().split('T')[0]

const parsePlanDate = (plan) => {
  const rawDate = plan.created_at || plan.updated_at || plan.createdAt || plan.updatedAt
  if (!rawDate) return null
  const date = new Date(rawDate)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const lastNDays = (count) => Array.from({ length: count }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - (count - 1 - index))
  return startOfDay(date)
})

const lastNWeeks = (count) => Array.from({ length: count }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - (count - 1 - index) * 7)
  return startOfDay(date)
})

function AnalyticsPage() {
  const { userPlans } = useUser()
  const plans = useMemo(() => userPlans || [], [userPlans])
  const [granularity, setGranularity] = useState('day')

  const totalPlans = plans.length
  const completedPlans = plans.filter((plan) => plan.done).length
  const completionRate = totalPlans ? Math.round((completedPlans / totalPlans) * 100) : 0

  const chartData = useMemo(() => {
    const windowDates = granularity === 'day' ? lastNDays(7) : lastNWeeks(4)

    const buckets = windowDates.map((windowStart) => {
      const windowEnd = granularity === 'day'
        ? new Date(windowStart.getTime() + DAY_MS)
        : new Date(windowStart.getTime() + 7 * DAY_MS)

      const bucketPlans = plans.filter((plan) => {
        const planDate = parsePlanDate(plan)
        return planDate && planDate >= windowStart && planDate < windowEnd
      })

      return {
        label: granularity === 'day' ? formatDayLabel(windowStart) : formatWeekLabel(windowStart),
        created: bucketPlans.length,
        completed: bucketPlans.filter((plan) => plan.done).length,
      }
    })

    return {
      labels: buckets.map((bucket) => bucket.label),
      created: buckets.map((bucket) => bucket.created),
      completed: buckets.map((bucket) => bucket.completed),
    }
  }, [granularity, plans])

  const periodSummary = useMemo(() => {
    const counts = plans.reduce(
      (acc, plan) => {
        const planDate = parsePlanDate(plan)
        if (!planDate) return acc

        const key = toDateKey(planDate)
        acc.days[key] = (acc.days[key] || 0) + 1

        const weekStart = startOfDay(new Date(planDate))
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = toDateKey(weekStart)
        acc.weeks[weekKey] = (acc.weeks[weekKey] || 0) + 1
        return acc
      },
      { days: {}, weeks: {} },
    )

    const activeDates = Object.keys(counts.days).sort()
    const activeWeeks = Object.keys(counts.weeks).sort()

    return {
      activeDays: activeDates.length,
      activeWeeks: activeWeeks.length,
      recentDayCount: activeDates.slice(-1).map((dateKey) => counts.days[dateKey])[0] || 0,
      recentWeekCount: activeWeeks.slice(-1).map((weekKey) => counts.weeks[weekKey])[0] || 0,
    }
  }, [plans])

  const chartTitle = granularity === 'day' ? 'Daily activity' : 'Weekly activity'
  const chartSubtitle = granularity === 'day'
    ? 'Your plans created over the last 7 days.'
    : 'Your plans created over the last 4 weeks.'

  return (
    <AppShell title="Analytics" subtitle="Minimal insights that update from your real plan history">
      <div className="space-y-5">
        <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-heading">{chartTitle}</h2>
              <p className="text-sm text-slate-500">{chartSubtitle}</p>
            </div>
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setGranularity('day')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${granularity === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setGranularity('week')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${granularity === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total plans</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totalPlans}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completedPlans}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completion</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completionRate}%</p>
            </div>
          </div>

          <div className="mt-6 h-80">
            <Line
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    label: 'Created',
                    data: chartData.created,
                    borderColor: '#0f172a',
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                    fill: true,
                    tension: 0.42,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 1.5,
                    borderWidth: 2,
                  },
                  {
                    label: 'Completed',
                    data: chartData.completed,
                    borderColor: '#6C5CE7',
                    backgroundColor: 'rgba(108, 92, 231, 0.12)',
                    fill: true,
                    tension: 0.42,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#6C5CE7',
                    pointBorderWidth: 1.5,
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      pointStyle: 'circle',
                      boxWidth: 8,
                      color: '#64748b',
                      padding: 18,
                    },
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    padding: 12,
                    displayColors: false,
                  },
                },
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#94a3b8' },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    border: { display: false },
                    ticks: {
                      color: '#94a3b8',
                      precision: 0,
                    },
                  },
                },
              }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-50 px-3 py-1">Active days: {periodSummary.activeDays}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1">Active weeks: {periodSummary.activeWeeks}</span>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export default AnalyticsPage
