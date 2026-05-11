import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, userProfile, loading } = useUser()
  const [intentPath, setIntentPath] = useState('/dashboard')

  useEffect(() => {
    const storedIntent = localStorage.getItem('oauth_intent_path') || '/dashboard'
    localStorage.removeItem('oauth_intent_path')
    setIntentPath(storedIntent)
  }, [])

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login', { replace: true, state: { info: 'Sign in did not complete. Please try again.' } })
      return
    }

    const pending = sessionStorage.getItem('pending_profile_creation') === '1'
    const isProfileComplete = userProfile?.isProfileComplete ?? Boolean(user.user_metadata?.isProfileComplete)

    if (intentPath === '/profile-setup' || pending || !isProfileComplete) {
      navigate('/profile-setup', { replace: true })
      return
    }

    navigate('/dashboard', { replace: true })
  }, [intentPath, loading, navigate, user, userProfile])

  return <div>Completing sign in...</div>
}

export default AuthCallbackPage