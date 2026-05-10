import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function SettingsPage() {
  const { user, userProfile } = useUser()

  return (
    <SettingsContent
      key={userProfile?.id || user?.id || 'guest'}
      user={user}
      userProfile={userProfile}
    />
  )
}

function SettingsContent({ user, userProfile }) {
  const { saveUserProfile, signOut } = useUser()
  const [displayName, setDisplayName] = useState(userProfile?.username || user?.user_metadata?.username || '')
  const [age, setAge] = useState(userProfile?.age || user?.user_metadata?.age || '')
  const [gender, setGender] = useState(userProfile?.gender || user?.user_metadata?.gender || '')
  const [statusMessage, setStatusMessage] = useState('')

  const handleSave = async () => {
    const { error } = await saveUserProfile({
      username: displayName,
      age,
      gender,
      isProfileComplete: userProfile?.isProfileComplete ?? true,
    })

    if (error) {
      setStatusMessage('Error updating profile.')
    } else {
      setStatusMessage('Profile saved successfully.')
    }
    window.setTimeout(() => setStatusMessage(''), 3000)
  }

  const handleReset = () => {
    setDisplayName(userProfile?.username || user?.user_metadata?.username || '')
    setAge(userProfile?.age || user?.user_metadata?.age || '')
    setGender(userProfile?.gender || user?.user_metadata?.gender || '')
    setStatusMessage('Changes reverted.')
    window.setTimeout(() => setStatusMessage(''), 3000)
  }

  const handleSignOut = async () => {
    await signOut()
    try {
      setShowSignOut(false)
      navigate('/')
    } catch {
      // ignore
    }
  }

  const accountEmail = user?.email || 'No email connected'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  const [showSignOut, setShowSignOut] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
    } catch {
      // ignore
    }
  }

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      setStatusMessage('Password must be at least 6 characters.')
      window.setTimeout(() => setStatusMessage(''), 3000)
      return
    }
    if (password !== confirmPassword) {
      setStatusMessage('Passwords do not match.')
      window.setTimeout(() => setStatusMessage(''), 3000)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        console.error('Error setting password:', error)
        setStatusMessage(error.message || 'Failed to set password.')
      } else {
        setStatusMessage('Password set successfully.')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error('Exception setting password:', err)
      setStatusMessage('Failed to set password.')
    }

    window.setTimeout(() => setStatusMessage(''), 3000)
  }

  return (
    <AppShell title="Profile" subtitle="Manage your profile, login details, and security settings">
      <div className="grid gap-6 xl:grid-cols-[1.75fr_0.95fr]">
        <Card className="space-y-6 bg-white border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Account</p>
              <h1 className="text-2xl font-semibold text-slate-900">Profile details</h1>
            </div>

            <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-3xl font-bold text-white">
                {userProfile?.username?.[0]?.toUpperCase() || user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-900">{userProfile?.username || user?.user_metadata?.username || 'User profile'}</p>
                <p className="text-sm text-slate-500">Your profile information is shared across the planner experience.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Preferred name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter your display name"
              />
              <Input
                label="Email"
                value={accountEmail}
                disabled
                className="cursor-not-allowed bg-slate-100 text-slate-600"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="Your age"
              />
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between max-w-md gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Theme</p>
                <p className="mt-1 text-sm text-slate-500">Toggle between light and dark mode</p>
              </div>
              <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${theme === 'light' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  aria-pressed={theme === 'light'}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${theme === 'dark' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  aria-pressed={theme === 'dark'}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
            <Button variant="ghost" onClick={() => setShowSignOut(true)}>Sign Out</Button>
            {statusMessage && <span className="text-sm text-slate-500">{statusMessage}</span>}
          </div>
        </Card>

        <Card className="space-y-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Account security</p>
            <h2 className="text-xl font-semibold text-slate-900">Security settings</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3">
                <p className="font-semibold text-slate-900">Password</p>
                <p className="mt-1 text-sm text-slate-500">Set a password for your account.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-1">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="New password"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-slate-900 outline-none"
                />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm password"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={handleSetPassword}>Set password</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Sign out</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                onClick={() => setShowSignOut(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default SettingsPage
