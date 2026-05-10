import { useEffect, useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { ChevronLeft, ChevronRight, Save, Trash2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Button from '../components/Button'

function CalendarPage() {
  const { user, saveCalendarNote, getCalendarNote, deleteCalendarNote, loading } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [noteContent, setNoteContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load note when date changes
  useEffect(() => {
    loadNote(selectedDate)
  }, [selectedDate])

  const loadNote = async (date) => {
    try {
      setError('')
      const dateStr = date.toISOString().split('T')[0]
      console.log('🔄 Loading note for date:', dateStr)
      
      const note = await getCalendarNote(date)
      
      if (note) {
        console.log('✅ Note loaded from database:', {
          date: note.note_date,
          contentLength: note.content?.length || 0,
        })
        setNoteContent(note.content || '')
      } else {
        console.log('ℹ️ No note found for this date, showing empty editor')
        setNoteContent('')
      }
    } catch (err) {
      console.error('❌ Error loading note:', err)
      setError('Failed to load note')
      setNoteContent('')
    }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      setError('Please write something to save')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      console.log('💾 Starting to save note for date:', selectedDate.toISOString().split('T')[0])
      await saveCalendarNote(selectedDate, noteContent)
      console.log('✅ Note saved and UI updated')
      setSuccess('Note saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('❌ Error saving note in UI:', err)
      setError(err.message || 'Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return

    setIsSaving(true)
    setError('')

    try {
      await deleteCalendarNote(selectedDate)
      setNoteContent('')
      setSuccess('Note deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting note:', err)
      setError('Failed to delete note')
    } finally {
      setIsSaving(false)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
  }

  const isToday = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const selectedDateStr = selectedDate.toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  if (!user) {
    return (
      <AppShell title="Loading..." subtitle="Loading calendar...">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-slate-600">Loading your calendar...</p>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Calendar Notes" subtitle="Store and manage your notes on specific dates">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Calendar Section */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-lg font-semibold text-slate-900">Calendar</h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="p-2"
                    onClick={previousMonth}
                    title="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    className="p-2"
                    onClick={nextMonth}
                    title="Next month"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              <p className="text-center text-sm font-semibold text-slate-700 mb-4">{monthName}</p>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day && handleDateClick(day)}
                    disabled={!day}
                    className={`aspect-square rounded-lg text-sm font-medium transition ${
                      !day
                        ? 'text-slate-300 cursor-default'
                        : isSelected(day)
                        ? 'bg-purple-600 text-white shadow-md'
                        : isToday(day)
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Note Section */}
          <Card className="overflow-hidden">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-heading text-lg font-semibold text-slate-900">
                  Notes for {selectedDateStr}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Write and save your notes for this date</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {success}
                </div>
              )}

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your notes here... (max 5000 characters)"
                maxLength={5000}
                className="w-full min-h-64 p-4 rounded-lg border border-slate-200 font-mono text-sm placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {noteContent.length} / 5000 characters
                </p>
                <div className="flex gap-2">
                  {noteContent && (
                    <Button
                      variant="ghost"
                      onClick={handleDeleteNote}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSaving || !noteContent.trim()}
                    className="inline-flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default CalendarPage
