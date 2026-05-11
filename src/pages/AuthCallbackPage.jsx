import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'

function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userProfile, loading } = useUser()
  const [processing, setProcessing] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(location.search)
        const code = params.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setAuthError(error.message || 'Failed to complete sign in.')
          }
        }
      } catch (error) {
        setAuthError(error.message || 'Failed to complete sign in.')
      } finally {
        setProcessing(false)
      }
    }

    processCallback()
  }, [location.search])

  useEffect(() => {
    if (processing || loading) return

    if (authError) {
      navigate('/login', { replace: true, state: { info: authError } })
      return
    }

    if (!user) {
      navigate('/login', { replace: true, state: { info: 'Sign in did not complete. Please try again.' } })
      return
    }

    const isProfileComplete = userProfile?.isProfileComplete ?? Boolean(user.user_metadata?.isProfileComplete)
    navigate(isProfileComplete ? '/dashboard' : '/profile-setup', { replace: true })
  }, [authError, loading, navigate, processing, user, userProfile])

  return <div>Completing sign in...</div>
}

export default AuthCallbackPage