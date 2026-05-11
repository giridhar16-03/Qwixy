import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'

function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)
  const navigate = useNavigate()
  const { signUp, rateLimitResetTime, signInWithGoogle, user, loading: authLoading } = useUser()

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle('/profile-setup')
      if (error) {
        console.error('Google signup error:', error)
        setErrors({ general: `Google signup failed: ${error.message || 'Unknown error'}` })
      }
    } catch (err) {
      console.error('Google signup exception:', err)
      setErrors({ general: `Error: ${err.message || 'Google signup failed'}` })
    }
    setLoading(false)
  }

  useEffect(() => {
    const storedResetTime = localStorage.getItem('signupRateLimitResetTime')
    if (storedResetTime) {
      const remaining = Math.ceil((parseInt(storedResetTime) - Date.now()) / 1000)
      if (remaining > 0) {
        setRateLimitCountdown(remaining)
      } else {
        localStorage.removeItem('signupRateLimitResetTime')
      }
    }
  }, [])

  useEffect(() => {
    if (rateLimitResetTime && rateLimitResetTime > Date.now()) {
      const remaining = Math.ceil((rateLimitResetTime - Date.now()) / 1000)
      setRateLimitCountdown(Math.max(1, remaining))

      const timer = setInterval(() => {
        const now = Date.now()
        const timeLeft = Math.ceil((rateLimitResetTime - now) / 1000)
        if (timeLeft <= 0) {
          setRateLimitCountdown(0)
          localStorage.removeItem('signupRateLimitResetTime')
          clearInterval(timer)
        } else {
          setRateLimitCountdown(timeLeft)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [rateLimitResetTime])

  const onSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.'
    if (!form.email.includes('@')) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setLoading(true)
      const { data, error } = await signUp(form.email, form.password, { username: form.name.trim() })
      setLoading(false)
      if (error) {
        const isRateLimit = error?.status === 429 || /rate limit|too many|too_many_requests/i.test(error?.message || '')
        const rateLimitMessage = isRateLimit
          ? 'Email rate limit exceeded. Please wait before trying again.'
          : error?.message || 'Signup failed'
        setErrors({ general: rateLimitMessage })
      } else if (data?.session) {
        navigate('/profile-setup')
      } else {
        navigate('/login', {
          state: {
            info: 'Account created. Please verify your email if required, then log in to continue.',
          },
        })
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200">
        <h1 className="font-heading text-3xl font-bold text-heading">Create Account</h1>
        <p className="mt-1 text-body">Start your AI-powered study journey.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full Name"
            value={form.name}
            error={errors.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            error={errors.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
          {rateLimitCountdown > 0 && (
            <p className="text-sm text-amber-600">
              Too many signup attempts. Please wait {rateLimitCountdown}s before trying again.
            </p>
          )}
          <Button
            className="w-full"
            type="submit"
            disabled={loading || rateLimitCountdown > 0}
          >
            {loading ? 'Creating account...' : rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : 'Signup'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-300" />
          <span className="text-sm text-slate-500">or</span>
          <div className="flex-1 border-t border-slate-300" />
        </div>

        <Button
          className="w-full mt-3 border border-highlightBorder bg-lightPurple text-primary hover:bg-accent/20"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignUp}
        >
          Sign up with Google
        </Button>

        <p className="mt-5 text-sm text-body">
          Already have an account?{' '}
          <Link className="font-semibold text-primary" to="/login">
            Login
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default SignupPage
