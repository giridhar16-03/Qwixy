import { Link, NavLink } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import Button from './Button'
import { navLinks } from '../utils/mockData'

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-heading font-heading">
          
          Qwixy
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.path} className="text-sm font-medium text-body hover:text-heading">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-heading hover:text-primary">
            Login
          </Link>
          <Link to="/signup">
            <Button className="px-4 py-2 text-sm">Signup</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
