import { useEffect, useState, useRef } from 'react'
import { useUser } from '../contexts/UserContext'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Button from '../components/Button'

function AssistantPage() {
  const { user, getAssistantMessages, sendToQwixy } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadMessages()
  }, [user])

  const loadMessages = async () => {
    try {
      const msgs = await getAssistantMessages(10)
      setMessages(msgs || [])
      scrollToEnd()
    } catch (err) {
      console.error('Error loading assistant messages:', err)
      setError('Failed to load assistant history')
    }
  }

  const scrollToEnd = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    setIsSending(true)
    setError('')

    try {
      const nextMessages = [...messages, { role: 'user', content: input }].slice(-10)
      setMessages(nextMessages)
      const prompt = input
      setInput('')
      scrollToEnd()

      const reply = await sendToQwixy(prompt)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }].slice(-10))
      scrollToEnd()
    } catch (err) {
      console.error('Error sending to qwixy:', err)
      setError(err.message || 'Failed to send')
    } finally {
      setIsSending(false)
    }
  }

  if (!user) {
    return (
      <AppShell title="Qwixy AI" subtitle="Minimal AI assistant for your study plan">
        <div className="mx-auto w-full max-w-3xl">
          <Card className="border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lightPurple text-primary">
              Q
            </div>
            <h2 className="font-heading text-2xl font-semibold text-slate-900">Sign in to use Qwixy AI</h2>
            <p className="mt-2 text-sm text-slate-500">Save conversations, ask for study help, and get simple suggestions from one place.</p>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Qwixy AI" subtitle="A light, focused chat for study help">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Assistant</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-slate-900">Ask Qwixy AI</h2>
              <p className="mt-1 text-sm text-slate-500">Short questions. Clear answers. Saved automatically for your account.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Messages</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{messages.length}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['Plan my week', 'Explain a topic simply', 'Break down this task'].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 transition hover:border-primary/30 hover:text-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[60vh] overflow-y-auto p-5">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No conversations yet. Start with a short prompt.
                </div>
              )}

              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      m.role === 'user'
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          {error && <div className="border-t border-slate-200 px-5 py-3 text-sm text-rose-600">{error}</div>}

          <div className="border-t border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[88px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Ask Qwixy AI to analyze your tasks or suggest resources..."
              />
              <Button
                variant="secondary"
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="h-10 shrink-0 border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100 sm:h-10 sm:px-4"
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export default AssistantPage
