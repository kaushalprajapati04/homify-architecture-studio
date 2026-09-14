import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Compass, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 blueprint-grid relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <svg viewBox="0 0 400 400" className="w-full max-w-md opacity-90">
            <motion.rect x="50" y="50" width="300" height="300" fill="none" stroke="rgba(74,144,217,0.4)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2 }} />
            {[
              { x: 50, y: 50, w: 200, h: 140, l: 'LIVING ROOM' },
              { x: 250, y: 50, w: 100, h: 140, l: 'KITCHEN' },
              { x: 50, y: 190, w: 140, h: 160, l: 'MASTER BED' },
              { x: 190, y: 190, w: 160, h: 80, l: 'BATH' },
              { x: 190, y: 270, w: 160, h: 80, l: 'STUDY' },
            ].map((r, i) => (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(74,144,217,0.05)" stroke="rgba(74,144,217,0.3)" strokeWidth="1" />
                <text x={r.x + r.w / 2} y={r.y + r.h / 2} fill="rgba(74,144,217,0.6)" fontSize="10" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">{r.l}</text>
              </motion.g>
            ))}
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-ink-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-ink-900 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-ink-900">HOMIFY</span>
              <span className="text-[10px] font-medium tracking-widest text-ink-400 uppercase">Architecture Studio</span>
            </div>
          </Link>

          <h1 className="text-2xl font-bold text-ink-900 mb-2">Create your account</h1>
          <p className="text-ink-500 mb-8">Start designing intelligent floor plans.</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" disabled={loading} className="input-field pl-11" autoComplete="name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" disabled={loading} className="input-field pl-11" autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" disabled={loading} className="input-field pl-11 pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="flex gap-4 mt-2">
                  {passwordChecks.map((c) => (
                    <span key={c.label} className={`flex items-center gap-1 text-xs ${c.met ? 'text-green-600' : 'text-ink-400'}`}>
                      <CheckCircle2 className="w-3 h-3" /> {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input type={showPassword ? 'text' : 'password'} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••" disabled={loading} className="input-field pl-11" autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-600 font-semibold hover:text-accent-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
