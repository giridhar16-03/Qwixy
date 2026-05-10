// Local authentication database using IndexedDB
const DB_NAME = 'StudyPlannerDB'
const DB_VERSION = 1
const USERS_STORE = 'users'
const SESSIONS_STORE = 'sessions'

let db = null

// Initialize IndexedDB
export const initLocalDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Create users store
      if (!database.objectStoreNames.contains(USERS_STORE)) {
        const usersStore = database.createObjectStore(USERS_STORE, { keyPath: 'id' })
        usersStore.createIndex('email', 'email', { unique: true })
      }

      // Create sessions store
      if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
        database.createObjectStore(SESSIONS_STORE, { keyPath: 'userId' })
      }
    }
  })
}

// Hash password (basic - use bcrypt in production)
const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Sign up locally
export const signUpLocal = async (email, password, userData) => {
  try {
    const database = await initLocalDB()
    const hashedPassword = await hashPassword(password)
    const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const user = {
      id: userId,
      email,
      password: hashedPassword,
      username: userData.username || 'User',
      age: userData.age || null,
      gender: userData.gender || null,
      isProfileComplete: false,
      createdAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([USERS_STORE], 'readwrite')
      const store = transaction.objectStore(USERS_STORE)

      // Check if email already exists
      const emailIndex = store.index('email')
      const emailRequest = emailIndex.get(email)

      emailRequest.onsuccess = () => {
        if (emailRequest.result) {
          reject(new Error('Email already registered'))
          return
        }

        const addRequest = store.add(user)

        addRequest.onsuccess = () => {
          resolve({ user, error: null })
        }

        addRequest.onerror = () => {
          reject(addRequest.error)
        }
      }

      emailRequest.onerror = () => {
        reject(emailRequest.error)
      }
    })
  } catch (error) {
    return { user: null, error }
  }
}

// Sign in locally
export const signInLocal = async (email, password) => {
  try {
    const database = await initLocalDB()
    const hashedPassword = await hashPassword(password)

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([USERS_STORE], 'readonly')
      const store = transaction.objectStore(USERS_STORE)
      const emailIndex = store.index('email')
      const request = emailIndex.get(email)

      request.onsuccess = () => {
        const user = request.result

        if (!user) {
          reject(new Error('User not found'))
          return
        }

        if (user.password !== hashedPassword) {
          reject(new Error('Invalid password'))
          return
        }

        // Create session
        const sessionTransaction = database.transaction([SESSIONS_STORE], 'readwrite')
        const sessionStore = sessionTransaction.objectStore(SESSIONS_STORE)
        const session = {
          userId: user.id,
          email: user.email,
          username: user.username,
          createdAt: new Date().toISOString(),
        }

        sessionStore.put(session)

        resolve({ user, error: null })
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    return { user: null, error }
  }
}

// Get current session
export const getLocalSession = async () => {
  try {
    const database = await initLocalDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SESSIONS_STORE], 'readonly')
      const store = transaction.objectStore(SESSIONS_STORE)

      // Get all sessions (typically just one)
      const request = store.getAll()

      request.onsuccess = () => {
        const sessions = request.result
        if (sessions.length > 0) {
          resolve(sessions[0])
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Sign out locally
export const signOutLocal = async () => {
  try {
    const database = await initLocalDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SESSIONS_STORE], 'readwrite')
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Update user profile
export const updateLocalUserProfile = async (userId, updates) => {
  try {
    const database = await initLocalDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([USERS_STORE], 'readwrite')
      const store = transaction.objectStore(USERS_STORE)
      const request = store.get(userId)

      request.onsuccess = () => {
        const user = request.result

        if (!user) {
          reject(new Error('User not found'))
          return
        }

        const updatedUser = { ...user, ...updates }
        const updateRequest = store.put(updatedUser)

        updateRequest.onsuccess = () => {
          resolve(updatedUser)
        }

        updateRequest.onerror = () => {
          reject(updateRequest.error)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}
