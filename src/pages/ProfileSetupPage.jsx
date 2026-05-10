import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'

function ProfileSetupPage() {
  const [form, setForm] = useState({ name: '', age: '', gender: '' })
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { user, userProfile, loading, saveUserProfile } = useUser()

  useEffect(() => {
    if (!user) return

    setForm({
      name: userProfile?.username || user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      age: userProfile?.age || user.user_metadata?.age || '',
      gender: userProfile?.gender || user.user_metadata?.gender || '',
    })
  }, [user, userProfile])

  useEffect(() => {
    if (userProfile?.isProfileComplete && userProfile?.username) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, userProfile])

  const onSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (form.name.trim().length < 2) nextErrors.name = 'Please enter your name.'
    if (!form.age || form.age < 13 || form.age > 100) nextErrors.age = 'Please enter a valid age (13-100).'
    if (!form.gender) nextErrors.gender = 'Please select your gender.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      const { error } = await saveUserProfile({
        username: form.name,
        age: Number(form.age),
        gender: form.gender,
        isProfileComplete: true,
      })

      if (error) {
        setErrors({ general: error.message })
      } else {
        navigate('/dashboard')
      }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
        <Card className="w-full max-w-md p-8 bg-white border border-slate-200">
          <h1 className="font-heading text-3xl font-bold text-heading">Login Required</h1>
          <p className="mt-1 text-body">Please login first to complete your profile setup.</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200">
        <h1 className="font-heading text-3xl font-bold text-heading">Complete Your Profile</h1>
        <p className="mt-1 text-body">Tell us a bit about yourself to personalize your experience.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full Name"
            value={form.name}
            error={errors.name}
            placeholder="Enter your name"
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Age"
            type="number"
            value={form.age}
            error={errors.age}
            placeholder="Enter your age"
            min="13"
            max="100"
            onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-heading mb-2">Gender</label>
            <select
              value={form.gender}
              onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
          </div>

          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

          <Button className="w-full" type="submit">
            Complete Setup
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default ProfileSetupPage