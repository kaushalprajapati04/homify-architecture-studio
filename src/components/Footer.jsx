import { Link } from 'react-router-dom';
import { Compass, GitFork, Share2, Briefcase, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent-600 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight text-white">HOMIFY</span>
                <span className="text-[10px] font-medium tracking-widest text-ink-500 uppercase">Architecture Studio</span>
              </div>
            </Link>
            <p className="text-sm text-ink-400 max-w-md leading-relaxed">
              The AI-powered architectural design platform. Create intelligent floor plans in 2D, modify with natural language, and bring your vision to life.
            </p>
            <div className="flex gap-3 mt-6">
              {[GitFork, Share2, Briefcase, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-ink-800 hover:bg-accent-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-ink-300" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-500">© 2026 Homify Architecture Studio. All rights reserved.</p>
          <p className="text-xs text-ink-500">Designed for architects.</p>
        </div>
      </div>
    </footer>
  );
}
