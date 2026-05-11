import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signInWithGoogle, user, loading: authLoading } = useUser()
  const infoMessage = location.state?.info

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle('/dashboard')
      if (error) {
        console.error('Google signin error:', error)
        setErrors({ general: `Google signin failed: ${error.message || 'Unknown error'}` })
      }
    } catch (err) {
      console.error('Google signin exception:', err)
      setErrors({ general: `Error: ${err.message || 'Google signin failed'}` })
    }
    setLoading(false)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.email.includes('@')) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setLoading(true)
      const { error } = await signIn(form.email, form.password)
      setLoading(false)
      if (error) {
        setErrors({ general: error.message })
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200">
        <h1 className="font-heading text-3xl font-bold text-heading">Welcome Back</h1>
        <p className="mt-1 text-body">Login to continue your study streak.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          {infoMessage && <p className="text-sm text-green-600">{infoMessage}</p>}
          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
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
          onClick={handleGoogleSignIn}
        >
          Sign in with Google
        </Button>

        <p className="mt-5 text-sm text-body">
          New user?{' '}
          <Link className="font-semibold text-primary" to="/signup">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
