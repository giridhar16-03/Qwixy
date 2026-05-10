# User Data Persistence System - Setup Guide

## Overview
This system ensures that each user's data (profile, plans, tasks) is securely stored and retrieved from the database keyed by their **unique user ID** generated at signup.

## How It Works

### 1. User Signup Flow
```
User signs up with email/password
    ↓
Supabase Auth generates unique user.id (UUID)
    ↓
App creates a profile row with id = user.id
    ↓
User completes profile setup (name, age, gender)
    ↓
Profile data saved to profiles table
```

### 2. User Creates Plan/Task
```
User clicks "Create task" on Dashboard
    ↓
App calls createPlan({ title, subject, topic, slot })
    ↓
Database inserts new plan with user_id = auth.uid()
    ↓
Plan is stored with the user's unique ID
    ↓
Form clears, plan appears in task list
```

### 3. User Closes Browser / Reloads Page
```
User reloads page
    ↓
App initializes with session (user.id is in localStorage)
    ↓
App loads profile where id = user.id
    ↓
App loads all plans where user_id = user.id
    ↓
User sees all their previous work
```

### 4. User Logs Out and Logs Back In
```
User logs out
    ↓
Session is cleared from browser
    ↓
User logs in with email/password
    ↓
Supabase restores session with same user.id (UUID)
    ↓
App loads profile and plans for that user.id
    ↓
All data is exactly as it was before logout
```

## RLS Policies (Row Level Security)

### Profiles Table Policies
These policies ensure **only the user can access their own profile**:

1. **"Users can read own profile"** (SELECT)
   - User A can only read profile where id = A's user.id
   - User B cannot see User A's profile
   - Condition: `auth.uid() = id`

2. **"Users can insert own profile"** (INSERT)
   - User A can only insert a profile with id = A's user.id
   - Prevents one user from creating a profile for another user
   - Condition: `auth.uid() = id`

3. **"Users can update own profile"** (UPDATE)
   - User A can only update their own profile
   - User B cannot modify User A's profile
   - Condition: `auth.uid() = id`

### Plans Table Policies
These policies ensure **users can only access/modify their own plans**:

1. **"Users can read own plans"** (SELECT)
   - User A sees only plans where user_id = A's user.id
   - User B cannot see User A's plans
   - Condition: `auth.uid() = user_id`

2. **"Users can create own plans"** (INSERT)
   - User A can only create plans with user_id = A's user.id
   - Prevents one user from creating tasks for another
   - Condition: `auth.uid() = user_id`

3. **"Users can update own plans"** (UPDATE)
   - User A can only update their own plans
   - User B cannot edit User A's tasks
   - Condition: `auth.uid() = user_id`

4. **"Users can delete own plans"** (DELETE)
   - User A can only delete their own plans
   - User B cannot remove User A's tasks
   - Condition: `auth.uid() = user_id`

## Database Schema

### profiles table
```sql
id (UUID, primary key) = auth user ID (auto-generated at signup)
email (text)
username (text)
age (integer)
gender (text)
is_profile_complete (boolean)
created_at (timestamptz)
updated_at (timestamptz)
```

### plans table
```sql
id (bigint, primary key, auto-increment)
user_id (UUID, foreign key) = auth user ID (links plans to user)
title (text)
subject (text)
topic (text)
slot (text)
done (boolean)
created_at (timestamptz)
updated_at (timestamptz)
```

## Setup Instructions

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Run the SQL Script**
   - Create a new query
   - Copy all code from `supabase/setup_rls_policies.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message

3. **Verify Setup**
   - The script includes verification queries at the end
   - Look for output showing:
     - ✅ profiles table with rowsecurity = true
     - ✅ plans table with rowsecurity = true
     - ✅ All 7 policies listed (3 for profiles, 4 for plans)

4. **Test the App**
   - Sign up as a new user
   - Create a profile
   - Create some tasks
   - Refresh the page (data should persist)
   - Log out and log back in (data should still be there)
   - Try logging in as a different user (should only see their own data)

## Key Points

✅ **User ID is unique** - Generated once at signup, never changes
✅ **Data is user-isolated** - RLS policies prevent cross-user access
✅ **Data persists across** - Reloads, logouts, browser closes
✅ **Real-time sync** - Changes appear immediately
✅ **Secure** - Backend enforces policies, frontend cannot bypass them

## Data Flow Diagram

```
App Layer (React)
    │
    ├─ UserContext: Manages user.id and userProfile
    ├─ DashboardPage: Creates/reads plans for current user
    ├─ ProfileSetupPage: Saves profile for current user
    ├─ SettingsPage: Updates profile for current user
    │
    ↓
Supabase Client (JavaScript SDK)
    │
    ├─ Automatically includes auth.uid() in all queries
    ├─ Sends HTTP requests to Supabase API
    │
    ↓
Supabase Backend (PostgreSQL + RLS)
    │
    ├─ Receives query from user A
    ├─ Checks RLS policy: does auth.uid() = user_id?
    ├─ If YES ✅ - returns user A's data
    ├─ If NO ❌ - returns empty/error
    │
    ↓
Database (Only user A's data returned)
    │
    ↓
App (Displays user A's plans, profile, etc.)
```

## Troubleshooting

**Problem**: "User's data not showing after reload"
- **Solution**: Make sure profiles.sql script was run successfully
- Check that RLS is enabled on both tables

**Problem**: "Seeing other users' data"
- **Solution**: RLS policies not set up correctly
- Run setup_rls_policies.sql again

**Problem**: "Getting 'permission denied' errors"
- **Solution**: This is normal if RLS isn't set up yet
- After running setup_rls_policies.sql, errors should stop

**Problem**: "Data disappears when logged out"
- **Solution**: This is expected - RLS prevents unauthenticated access
- Data is safely stored, will reappear when you log back in
