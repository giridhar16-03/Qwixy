import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import ProfileSetupPage from '../pages/ProfileSetupPage'
import OnboardingPage from '../pages/OnboardingPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import CalendarPage from '../pages/CalendarPage'
import AssistantPage from '../pages/AssistantPage'
import PlannerPage from '../pages/PlannerPage'
import TimerPage from '../pages/TimerPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import SettingsPage from '../pages/SettingsPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
