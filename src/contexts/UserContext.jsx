import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userPlans, setUserPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [rateLimitResetTime, setRateLimitResetTime] = useState(null)

  const getProfileFromAuthUser = (authUser) => ({
    id: authUser.id,
    email: authUser.email || '',
    username: authUser.user_metadata?.username || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
    age: authUser.user_metadata?.age || '',
    gender: authUser.user_metadata?.gender || '',
    isProfileComplete: Boolean(authUser.user_metadata?.isProfileComplete),
  })

  const normalizeProfile = (row) => ({
    id: row.id,
    email: row.email || '',
    username: row.username || '',
    age: row.age || '',
    gender: row.gender || '',
    isProfileComplete: Boolean(row.is_profile_complete),
  })

  const ensureUserProfile = async (authUser) => {
    try {
      console.log('📥 Loading profile for user ID:', authUser.id)
      const fallbackProfile = getProfileFromAuthUser(authUser)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (error) {
        if (/relation .*profiles/i.test(error.message || '')) {
          console.warn('⚠️ Profiles table does not exist yet - using fallback')
          setUserProfile(fallbackProfile)
          return { data: fallbackProfile, error: null }
        }

        console.error('❌ Error loading user profile:', error)
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
          console.warn('⚠️ Permission denied - ensure RLS policies are set up in Supabase')
        }
        setUserProfile(fallbackProfile)
        return { data: fallbackProfile, error }
      }

      if (data) {
        const profile = normalizeProfile(data)
        console.log('✅ Profile retrieved from database for user ID:', data.id)
        setUserProfile(profile)
        return { data: profile, error: null }
      }

      const newProfilePayload = {
        id: authUser.id,
        email: authUser.email || '',
        username: fallbackProfile.username,
        age: fallbackProfile.age ? Number(fallbackProfile.age) : null,
        gender: fallbackProfile.gender || '',
        is_profile_complete: Boolean(fallbackProfile.isProfileComplete),
      }

      console.log('📝 Creating new profile for user ID:', authUser.id)
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfilePayload)
        .select('*')
        .single()

      if (createError) {
        if (/relation .*profiles/i.test(createError.message || '')) {
          console.warn('⚠️ Profiles table does not exist - using fallback')
          setUserProfile(fallbackProfile)
          return { data: fallbackProfile, error: null }
        }

        console.error('❌ Error creating user profile:', createError)
        setUserProfile(fallbackProfile)
        return { data: fallbackProfile, error: createError }
      }

      const normalizedProfile = normalizeProfile(createdProfile)
      console.log('✅ Profile created and stored in database for user ID:', createdProfile.id)
      setUserProfile(normalizedProfile)
      return { data: normalizedProfile, error: null }
    } catch (err) {
      console.error('❌ Exception in ensureUserProfile:', err)
      const fallbackProfile = getProfileFromAuthUser(authUser)
      setUserProfile(fallbackProfile)
      return { data: fallbackProfile, error: err }
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('🔄 Session found, loading user data for ID:', session.user.id)
          setUser(session.user)
          setLoading(false) // Show dashboard immediately
          
          // Load data in background (don't wait for this)
          Promise.all([
            ensureUserProfile(session.user),
            loadUserPlans(session.user.id),
          ]).then(() => {
            console.log('✅ All data loaded successfully')
          }).catch(err => {
            console.error('Error loading data in background:', err)
          })
        } else {
          console.log('ℹ️ No session found')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth session:', error)
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          console.log('🔄 Auth state changed, loading user data for ID:', session.user.id)
          setUser(session.user)
          setLoading(false) // Show dashboard immediately
          
          // Load data in background
          Promise.all([
            ensureUserProfile(session.user),
            loadUserPlans(session.user.id),
          ]).then(() => {
            console.log('✅ All data loaded successfully')
          }).catch(err => {
            console.error('Error loading data in background:', err)
          })
        } else {
          console.log('ℹ️ User signed out')
          setUser(null)
          setUserProfile(null)
          setUserPlans([])
          setLoading(false)
        }
      } catch (error) {
        console.error('Error during auth state change:', error)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserPlans = async (userId) => {
    try {
      console.log('📥 Fetching plans for user ID:', userId)
      let query = supabase
        .from('plans')
        .select('*')
        .eq('user_id', userId)

      let { data, error } = await query.order('created_at', { ascending: false })

      if (error && /created_at|column/i.test(error.message || '')) {
        console.warn('⚠️ Column error, retrying without order:', error.message)
        const fallback = await query
        data = fallback.data
        error = fallback.error
      }

      if (error) {
        console.error('❌ Error loading plans from database:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        // Check if it's a permission error (likely RLS not set up)
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
          console.warn('⚠️ Permission denied - ensure RLS policies are set up in Supabase SQL Editor')
        }
        // Preserve current UI list if reload fails so tasks don't disappear.
        return { data: [], error }
      }

      console.log(`✅ Loaded ${data?.length || 0} plans for user ID:`, userId)
      setUserPlans(data || [])
      return { data: data || [], error: null }
    } catch (err) {
      console.error('❌ Exception loading plans:', err)
      return { data: [], error: err }
    }
  }

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    // Handle rate limit error with better detection
    if (error) {
      const isRateLimit =
        error.status === 429 ||
        /rate limit|too many|too_many_requests|email.*rate/i.test(error.message || '')
      
      if (isRateLimit) {
        const resetTime = Date.now() + 60000 // 60 seconds from now
        setRateLimitResetTime(resetTime)
        localStorage.setItem('signupRateLimitResetTime', resetTime.toString())
      }
    }

    // If signup succeeded, immediately create a profile record with the user's unique ID
    if (!error && data?.user?.id) {
      const newProfilePayload = {
        id: data.user.id,
        email: email,
        username: (userData?.username || email?.split('@')[0] || '').trim(),
        age: null,
        gender: '',
        is_profile_complete: false,
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(newProfilePayload)
        .select()
        .single()

      if (profileError) {
        if (!/relation .*profiles|already exists/i.test(profileError.message || '')) {
          console.error('Error creating profile during signup:', profileError)
        }
      } else {
        console.log('✅ User ID stored in database:', data.user.id)
      }
    }

    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (!error && data?.user?.id) {
      console.log('✅ User logged in with ID:', data.user.id)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUserProfile(null)
    }
    return { error }
  }

  const saveUserProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('User not authenticated') }

    const existingProfile = userProfile || getProfileFromAuthUser(user)
    const payload = {
      id: user.id,
      email: user.email || existingProfile.email || '',
      username: (updates.username ?? existingProfile.username ?? '').trim(),
      age: updates.age === '' || updates.age === null || updates.age === undefined
        ? null
        : Number(updates.age),
      gender: updates.gender ?? existingProfile.gender ?? '',
      is_profile_complete: updates.isProfileComplete ?? existingProfile.isProfileComplete ?? false,
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      if (!/relation .*profiles/i.test(error.message || '')) {
        console.error('Error saving user profile:', error)
        return { data: null, error }
      }
    }

    const metadataPayload = {
      username: payload.username,
      age: payload.age,
      gender: payload.gender,
      isProfileComplete: Boolean(payload.is_profile_complete),
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: metadataPayload,
    })

    if (metadataError) {
      console.error('Error syncing auth metadata:', metadataError)
    }

    const nextProfile = data
      ? normalizeProfile(data)
      : {
          ...existingProfile,
          email: payload.email,
          username: payload.username,
          age: payload.age || '',
          gender: payload.gender,
          isProfileComplete: Boolean(payload.is_profile_complete),
        }

    setUserProfile(nextProfile)
    return { data: nextProfile, error: null }
  }

  // Allow the currently authenticated user to set/update their password
  const setPassword = async (newPassword) => {
    try {
      if (!user) return { data: null, error: new Error('User not authenticated') }
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        console.error('Error updating password:', error)
        return { data: null, error }
      }
      return { data, error: null }
    } catch (err) {
      console.error('Exception updating password:', err)
      return { data: null, error: err }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth with Supabase...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`,
        },
      })
      if (error) {
        console.error('Supabase Google OAuth error:', error)
      } else {
        console.log('Google OAuth initiated, awaiting redirect...')
      }
      return { data, error }
    } catch (err) {
      console.error('Google OAuth exception:', err)
      return { data: null, error: err }
    }
  }

  const createPlan = async (plan) => {
    if (!user) return { data: null, error: new Error('User not authenticated') }

    const payload = {
      user_id: user.id,
      title: plan.title?.trim() || 'Untitled',
      subject: plan.subject?.trim() || '',
      topic: plan.topic?.trim() || '',
      slot: plan.slot?.trim() || '',
      done: Boolean(plan.done),
    }

    const { data, error } = await supabase
      .from('plans')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      return { data: null, error }
    }

    console.log('✅ Plan created for user ID:', user.id, '| Plan ID:', data.id)
    setUserPlans((prev) => [data, ...(prev || [])])
    return { data, error: null }
  }

  const updatePlan = async (planId, updates) => {
    if (!user) return { data: null, error: new Error('User not authenticated') }

    console.log('📝 Updating plan:', planId, 'with done:', updates.done)

    const payload = {
      title: updates.title?.trim() || 'Untitled',
      subject: updates.subject?.trim() || '',
      topic: updates.topic?.trim() || '',
      slot: updates.slot?.trim() || '',
      done: Boolean(updates.done),
    }

    console.log('📤 Sending payload to database:', payload)

    const { data: updateData, error } = await supabase
      .from('plans')
      .update(payload)
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('❌ Error updating plan:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      
      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        console.error('⚠️ PERMISSION DENIED - RLS Policies might not be set up in Supabase')
        console.error('Please run the SQL setup script in Supabase SQL Editor: supabase/setup_rls_policies.sql')
      }
      
      return { data: null, error }
    }

    console.log('✅ Plan updated in database, reloading plans...')
    await loadUserPlans(user.id)
    return { data: null, error: null }
  }

  const deletePlan = async (planId) => {
    if (!user) return { error: new Error('User not authenticated') }

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting plan:', error)
      return { error }
    }

    await loadUserPlans(user.id)
    return { error: null }
  }

  const saveUserPlans = async (plans) => {
    if (!user) return { error: new Error('User not authenticated') }

    const { error: deleteError } = await supabase.from('plans').delete().eq('user_id', user.id)
    if (deleteError) {
      console.error('Error clearing previous plans:', deleteError)
      return { error: deleteError }
    }

    if (!plans.length) {
      setUserPlans([])
      return { error: null }
    }

    const plansToInsert = plans.map((plan) => ({
      user_id: user.id,
      title: plan.title?.trim() || 'Untitled',
      subject: plan.subject?.trim() || '',
      topic: plan.topic?.trim() || '',
      slot: plan.slot?.trim() || '',
      done: Boolean(plan.done),
    }))

    const { data, error } = await supabase.from('plans').insert(plansToInsert).select('*')
    if (error) {
      console.error('Error saving plans:', error)
      return { error }
    }

    setUserPlans(data || [])
    return { error: null }
  }

  const reloadUserPlans = async () => {
    if (user) {
      await loadUserPlans(user.id)
    }
  }

  const reloadUserProfile = async () => {
    if (user) {
      await ensureUserProfile(user)
    }
  }

  const getCalendarNote = async (date) => {
    if (!user) {
      console.warn('⚠️ Cannot fetch note: User not authenticated')
      return null
    }

    try {
      const dateStr = date.toISOString().split('T')[0]
      console.log('📥 Fetching note for date:', dateStr, 'User ID:', user.id)

      const { data, error } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('note_date', dateStr)
        .single()

      if (error) {
        // PGRST116 = no rows returned, which is fine (note doesn't exist yet)
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No note found for this date (first time creating)')
          return null
        }
        
        // Other errors should be logged
        console.error('❌ Error fetching note:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          status: error.status,
        })
        
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
          console.error('⚠️ PERMISSION DENIED - RLS policies might not be set up')
        }
        
        return null
      }

      if (data) {
        console.log('✅ Note fetched successfully:', {
          id: data.id,
          date: data.note_date,
          contentLength: data.content?.length || 0,
        })
      }
      
      return data || null
    } catch (err) {
      console.error('❌ Exception fetching note:', err)
      console.error('Error stack:', err.stack)
      return null
    }
  }

  const saveCalendarNote = async (date, content) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const dateStr = date.toISOString().split('T')[0]
      console.log('📝 Saving note for date:', dateStr, 'User ID:', user.id)
      console.log('📝 Note content length:', content.trim().length, 'characters')

      const payload = {
        user_id: user.id,
        note_date: dateStr,
        content: content.trim(),
      }
      
      console.log('📤 Upserting payload:', {
        user_id: payload.user_id,
        note_date: payload.note_date,
        contentLength: payload.content.length,
      })

      const { data, error } = await supabase
        .from('calendar_notes')
        .upsert(payload, { onConflict: 'user_id,note_date' })
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving note:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          status: error.status,
        })
        
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
          console.error('⚠️ PERMISSION DENIED - RLS policies might not be set up')
          console.error('Please run create_calendar_notes_table.sql in Supabase SQL Editor')
        }
        
        throw error
      }

      console.log('✅ Note saved successfully:', {
        id: data?.id,
        date: data?.note_date,
        contentLength: data?.content?.length || 0,
      })
      
      return data
    } catch (err) {
      console.error('❌ Exception saving note:', err)
      console.error('Error message:', err.message)
      throw err
    }
  }

  const deleteCalendarNote = async (date) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const dateStr = date.toISOString().split('T')[0]
      console.log('🗑️ Deleting note for date:', dateStr, 'User ID:', user.id)

      const { error } = await supabase
        .from('calendar_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('note_date', dateStr)

      if (error) {
        console.error('❌ Error deleting note:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
        })
        throw error
      }

      console.log('✅ Note deleted successfully for date:', dateStr)
    } catch (err) {
      console.error('❌ Exception deleting note:', err)
      console.error('Error message:', err.message)
      throw err
    }
  }

  // Assistant / Qwixy helpers
  const getAssistantConversationRow = async () => {
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error fetching assistant conversation row:', error)
        return null
      }

      return (data && data[0]) || null
    } catch (err) {
      console.error('❌ Exception fetching assistant conversation row:', err)
      return null
    }
  }

  const saveAssistantConversation = async (messages, title = null) => {
    if (!user) throw new Error('User not authenticated')
    try {
      // Try to find existing row
      const existing = await getAssistantConversationRow()
      if (existing) {
        const { error } = await supabase
          .from('assistant_conversations')
          .update({ messages, title })
          .eq('id', existing.id)

        if (error) {
          console.error('❌ Error updating assistant conversation:', error)
          throw error
        }
        return { id: existing.id }
      }

      const { data, error } = await supabase
        .from('assistant_conversations')
        .insert({ user_id: user.id, messages, title })
        .select()
        .single()

      if (error) {
        console.error('❌ Error inserting assistant conversation:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('❌ Exception saving assistant conversation:', err)
      throw err
    }
  }

  const getAssistantMessages = async (limit = 10) => {
    const row = await getAssistantConversationRow()
    if (!row) return []
    // messages stored as array of {role, content}
    return (row.messages || []).slice(-limit)
  }

  const buildAssistantTaskContext = () => {
    const plans = (userPlans || []).slice(0, 12)

    if (plans.length === 0) {
      return 'No saved tasks yet.'
    }

    return plans
      .map((plan, index) => {
        const status = plan.done ? 'done' : 'pending'
        const title = plan.title || 'Untitled task'
        const subject = plan.subject || 'General'
        const topic = plan.topic || 'No topic provided'
        const slot = plan.slot || 'No time slot set'

        return `${index + 1}. ${title} | subject: ${subject} | topic: ${topic} | slot: ${slot} | status: ${status}`
      })
      .join('\n')
  }

  const sendToQwixy = async (userMessage) => {
    if (!user) {
      console.warn('⚠️ User not authenticated — returning local placeholder reply for testing')
      const assistantContent = 'Qwixy (local test): you are not signed in. Sign in to persist conversations.'
      return assistantContent
    }

    // Build messages history (last 10)
    const existingMessages = await getAssistantMessages(10)
    const messages = [...existingMessages, { role: 'user', content: userMessage }]

    // Trim to last 10
    const contextMessages = messages.slice(-10)
    const taskContext = buildAssistantTaskContext()
    const systemPrompt = {
      role: 'system',
      content: [
        'You are Qwixy, a concise study assistant for a student planner.',
        'Use the saved tasks below to suggest what to do next, recommend short tutorials or learning resources, and estimate how long each task may take.',
        'If a task is vague, mention what detail is missing and ask one short follow-up question if needed.',
        'Keep replies practical, minimal, and task-focused.',
        '',
        `Saved tasks:\n${taskContext}`,
      ].join('\n'),
    }

    const messagesForApi = [systemPrompt, ...contextMessages]

    // Prepare API call
    const apiUrl = import.meta.env.VITE_QWIXY_API_URL || ''
    const apiKey = import.meta.env.VITE_QWIXY_API_KEY || ''
    const model = import.meta.env.VITE_QWIXY_MODEL || 'llama-3.3-70b-versatile'

    // Determine endpoint: in production we call our serverless proxy at /api/qwixy
    const isProd = import.meta.env.PROD
    const useDevProxy = import.meta.env.DEV && !!import.meta.env.VITE_QWIXY_API_URL
    const fetchUrl = isProd || useDevProxy ? '/api/qwixy' : apiUrl

    // If no API configured for non-proxy mode, show fallback
    if (!fetchUrl || (!isProd && !apiUrl)) {
      console.warn('⚠️ Qwixy API not configured; returning local fallback reply for faster testing')
      const assistantContent = `Qwixy is not configured locally. I can still see ${userPlans.length} saved task(s), but to get live task-aware suggestions, set VITE_QWIXY_API_URL and VITE_QWIXY_API_KEY in your .env file.`
      // Try to save the placeholder reply so the UI shows history when possible, but ignore DB errors
      const newMessages = [...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)
      try {
        await saveAssistantConversation(newMessages)
      } catch (e) {
        console.debug('Could not persist assistant placeholder reply:', e?.message || e)
      }
      return assistantContent
    }

    try {
      const body = {
        messages: messagesForApi,
        model,
      }

      console.log('📨 Sending to Qwixy API', { apiUrl, model, messagesCount: contextMessages.length })

      // Retry on 5xx errors (transient gateway issues) with simple exponential backoff
      let res = null
      const maxRetries = 2
      let attempt = 0
      while (attempt <= maxRetries) {
        try {
          // If calling the direct API URL (not proxy), include Authorization header.
          const headers = { 'Content-Type': 'application/json' }
          if (fetchUrl === apiUrl && apiKey) headers.Authorization = `Bearer ${apiKey}`

          res = await fetch(fetchUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          })
        } catch (fetchErr) {
          console.error('❌ Network error calling Qwixy API:', fetchErr)
          let assistantContent = `Failed to call Qwixy API: ${fetchErr.message || fetchErr}`
          if ((fetchErr.message || '').toLowerCase().includes('failed to fetch')) {
            assistantContent += ' — this is often a CORS or network issue. In development enable the Vite proxy by setting VITE_QWIXY_API_URL in your .env and restarting the dev server, or ensure the target allows CORS.'
          }
          try { await saveAssistantConversation([...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)) } catch (e) { console.debug('Could not persist network-failure reply:', e?.message || e) }
          return assistantContent
        }

        // If server error (5xx), retry a few times
        if (res && res.status >= 500 && res.status < 600 && attempt < maxRetries) {
          const waitMs = 400 * Math.pow(2, attempt) // 400ms, 800ms, ...
          console.warn(`⚠️ Qwixy API returned ${res.status}. Retrying in ${waitMs}ms (attempt ${attempt + 1})`)
          await new Promise((r) => setTimeout(r, waitMs))
          attempt++
          continue
        }

        break
      }

      if (!res) {
        const assistantContent = 'Qwixy API call failed with no response.'
        try { await saveAssistantConversation([...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)) } catch (e) { console.debug('Could not persist no-response reply:', e?.message || e) }
        return assistantContent
      }

      if (!res.ok && res.status >= 500) {
        const text = await res.text().catch(() => null)
        const assistantContent = `Qwixy API error ${res.status} after ${attempt + 1} attempts: ${text || res.statusText}`
        try { await saveAssistantConversation([...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)) } catch (e) { console.debug('Could not persist server-error reply:', e?.message || e) }
        return assistantContent
      }

      let json = null
      try {
        json = await res.json()
      } catch (parseErr) {
        const text = await res.text().catch(() => null)
        console.warn('⚠️ Qwixy returned non-JSON response', { status: res.status, statusText: res.statusText, text })
        if (!res.ok) {
          const assistantContent = `Qwixy API error ${res.status}: ${text || res.statusText}`
          try { await saveAssistantConversation([...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)) } catch (e) { console.debug('Could not persist non-JSON reply:', e?.message || e) }
          return assistantContent
        }
        // fallback to using raw text if parse failed
        json = { text: text || null }
      }

      console.log('📥 Qwixy API response:', json)

      // Extract assistant content from common places
      let assistantContent = null
      if (json?.choices && Array.isArray(json.choices) && json.choices[0]?.message?.content) {
        assistantContent = json.choices[0].message.content
      } else if (json?.output && Array.isArray(json.output) && json.output[0]?.content) {
        // some APIs use output array
        const c = json.output[0].content
        if (typeof c === 'string') assistantContent = c
        else if (Array.isArray(c) && c[0]?.text) assistantContent = c[0].text
      } else if (json?.text) {
        assistantContent = json.text
      }

      if (!assistantContent) {
        console.warn('⚠️ Could not extract assistant reply from API response')
        assistantContent = JSON.stringify(json)
      }

      // Append assistant reply and save back to DB (keep last 10)
      const newMessages = [...contextMessages, { role: 'assistant', content: assistantContent }].slice(-10)
      await saveAssistantConversation(newMessages)

      return assistantContent
    } catch (err) {
      console.error('❌ Error calling Qwixy API:', err)
      throw err
    }
  }

  const clearUser = () => {
    setUser(null)
    setUserProfile(null)
    setUserPlans([])
  }

  const value = {
    user,
    userProfile,
    userPlans,
    loading,
    rateLimitResetTime,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    saveUserProfile,
    createPlan,
    updatePlan,
    deletePlan,
    saveUserPlans,
    reloadUserPlans,
    reloadUserProfile,
    getCalendarNote,
    saveCalendarNote,
    deleteCalendarNote,
    // calendar
    clearUser,
    // assistant
    getAssistantMessages,
    saveAssistantConversation,
    sendToQwixy,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
