import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, ChartNoAxesColumn, CheckSquare, Clock3, Sparkles } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Card from '../components/Card'
import SectionContainer from '../components/SectionContainer'
import { featureCards } from '../utils/mockData'

const icons = [Brain, CheckSquare, Clock3, ChartNoAxesColumn, Sparkles]

function HomePage() {
  const { user, userProfile } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    const errorCode = query.get('error_code')

    if (errorCode === 'flow_state_already_used') {
      navigate('/login', {
        replace: true,
        state: { info: 'Sign in session expired. Please try Google login again.' },
      })
      return
    }

    if (!user) return

    const pending = sessionStorage.getItem('pending_profile_creation') === '1'
    const isProfileComplete = userProfile?.isProfileComplete ?? Boolean(user.user_metadata?.isProfileComplete)
    navigate(pending || !isProfileComplete ? '/profile-setup' : '/dashboard', { replace: true })
  }, [location.search, navigate, user, userProfile])

  return (
    <div className="min-h-screen bg-grid-pattern">
      <Navbar />
      <SectionContainer className="pt-16">
        <div className="grid items-center gap-8 rounded-3xl border border-highlightBorder bg-white p-6 shadow-soft lg:grid-cols-2 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.80 }}
          >
            <span className="inline-block rounded-full bg-lightPurple px-4 py-1 text-sm font-semibold text-primary">
              Smarter Planning, Better Results
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-heading sm:text-5xl">
              AI-Powered <span className="text-primary">Study Planner</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-body">
              Plan smarter, track better, and achieve your goals with a clean all-in-one productivity suite.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.80 }}
          >
          <Card className="rounded-3xl bg-slate-50 p-6">
            
            <h3 className="font-heading text-2xl font-semibold text-heading">Yo!...Peeps</h3>
            <p className="text-sm text-muted">Let's plan your productive day</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[
                ['Tasks', '12'],
                ['Completed', '8'],
                ['Focus Time', '3h 45m'],
                ['Streak', '7 days'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white p-3">
                  <p className="text-xs text-muted">{k}</p>
                  <p className="font-semibold text-heading">{v}</p>
                </div>
              ))}
            </div>
            
          </Card>
          </motion.div>
        </div>
      </SectionContainer>

      <SectionContainer id="features">
         <motion.div
           initial={{ opacity: 0, y: 16 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, amount: 0.2 }}
           transition={{ duration: 0.80 }}
         >
        <h2 className="text-center font-heading text-3xl font-bold text-heading">Powerful Features</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featureCards.map((feature, index) => {
            const Icon = icons[index]
            return (
              <Card key={feature.title} className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-lightPurple text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-heading">{feature.title}</h3>
                <p className="mt-2 text-sm text-body">{feature.detail}</p>
              </Card>
            )
          })}
        </div>
        </motion.div>
      </SectionContainer>

      <SectionContainer className="bg-sectionBg/60" id="about">
        <h2 className="text-center font-heading text-3xl font-bold text-heading">How It Works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {['Enter Subjects', 'AI Creates Plan', 'Track Tasks', 'Improve with Insights'].map((step, index) => (
            <Card key={step} className="text-center">
              <span className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="font-heading text-lg font-semibold text-heading">{step}</h3>
              <p className="mt-2 text-sm text-body">Stay consistent with guided planning and adaptive feedback.</p>
            </Card>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="text-center">
            <p className="text-3xl font-bold text-primary">1000+</p>
            <p className="mt-1 text-body">Students Trust Qwixy</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-success">80%</p>
            <p className="mt-1 text-body">Improved Productivity</p>
          </Card>
          <Card>
            <p className="text-body">“Qwixy changed the way I study. I manage time much better now.”</p>
            <p className="mt-3 font-semibold text-heading">- Priya Sharma</p>
          </Card>
        </div>
      </SectionContainer>

      <footer className="border-t border-border bg-white">
        <SectionContainer className="py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <p>Made with ❤️ by Qwixy Team</p>
            <div className="flex gap-4">
              <span></span>
              <span></span>
            </div>
          </div>
        </SectionContainer>
      </footer>
    </div>
  )
}

export default HomePage
