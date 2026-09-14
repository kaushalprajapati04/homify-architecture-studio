import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, LogIn, UserPlus, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/#features' },
    { label: 'How It Works', to: '/#how-it-works' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-sm shadow-ink-900/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-ink-900 flex items-center justify-center group-hover:bg-accent-600 transition-colors">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-ink-900">HOMIFY</span>
              <span className="text-[10px] font-medium tracking-widest text-ink-400 uppercase">Architecture Studio</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-ghost text-sm">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <span className="text-sm text-ink-400 px-2 hidden lg:inline">{user?.email}</span>
                <button onClick={handleLogout} className="btn-ghost text-sm">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">
                  <LogIn className="w-4 h-4" /> Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  <UserPlus className="w-4 h-4" /> Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass rounded-2xl mb-4 p-4 flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900">
                {link.label}
              </Link>
            ))}
            <div className="border-t border-ink-200 pt-2 mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
                  <button onClick={handleLogout} className="btn-ghost text-sm">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">Login</Link>
                  <Link to="/register" className="btn-primary text-sm">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
