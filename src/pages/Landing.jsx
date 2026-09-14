import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles, Ruler, Box, Wand2, Building2, Maximize,
  Armchair, FolderKanban, ArrowRight, Play, CheckCircle2,
  Layers, Cpu, Eye, MousePointerClick,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  { icon: Sparkles, title: 'AI Floor Plan Generation', desc: 'Describe your dream space and watch AI generate a complete architectural floor plan in seconds.' },
  { icon: Ruler, title: 'Professional 2D Planning', desc: 'CAD-grade 2D editor with walls, doors, windows, dimensions, and technical drawing conventions.' },
  { icon: Box, title: 'Multiple Layout Options', desc: 'Explore different design possibilities with our flexible layout tools.' },
  { icon: Wand2, title: 'AI-Powered Modifications', desc: 'Modify your plan using natural language. "Make the kitchen larger" and watch it adapt.' },
  { icon: Building2, title: 'Multi-Floor Projects', desc: 'Design multi-story buildings with connected stairs and per-floor editing. Switch seamlessly.' },
  { icon: Maximize, title: 'Smart Dimensions', desc: 'Automatic architectural dimension lines with extension lines, arrowheads, and precise measurements.' },
  { icon: Armchair, title: 'Furniture & Fixtures', desc: 'A library of architectural furniture symbols — beds, sofas, counters, fixtures, and appliances.' },
  { icon: FolderKanban, title: 'Project Management', desc: 'Create, save, rename, and manage all your projects from a beautiful, organized dashboard.' },
];

const steps = [
  { icon: MousePointerClick, title: 'Define Your Plot', desc: 'Set plot dimensions, number of floors, and room requirements.' },
  { icon: Cpu, title: 'AI Generates the Plan', desc: 'Our AI engine creates a complete architectural floor plan tailored to your specifications.' },
  { icon: Eye, title: 'Review in 2D', desc: 'Inspect every detail in the 2D technical drawing and the interactive model.' },
  { icon: Wand2, title: 'Refine with AI', desc: 'Modify your plan with natural language commands or edit manually with professional tools.' },
];

const benefits = [
  'No CAD experience required',
  'Architect-grade technical drawings',
  'Real-time Architectural Plan Editing',
  'Natural language plan modifications',
  'Export to SVG and PNG',
  'Multi-floor building support',
];

function HeroVisual() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <motion.div ref={ref} style={{ y }} className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <div className="absolute inset-0 blueprint-grid rounded-3xl overflow-hidden shadow-2xl shadow-ink-900/20 border border-blueprint-line">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          <motion.line
            x1="40" y1="40" x2="360" y2="40"
            stroke="#4a90d9" strokeWidth="3" className="arch-line"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.line x1="360" y1="40" x2="360" y2="260" stroke="#4a90d9" strokeWidth="3" className="arch-line"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
          <motion.line x1="360" y1="260" x2="40" y2="260" stroke="#4a90d9" strokeWidth="3" className="arch-line"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }} />
          <motion.line x1="40" y1="260" x2="40" y2="40" stroke="#4a90d9" strokeWidth="3" className="arch-line"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1.1 }} />

          {[
              { x: 40, y: 40, w: 120, h: 80, label: 'LIVING' },
              { x: 160, y: 40, w: 200, h: 80, label: 'KITCHEN' },
              { x: 40, y: 120, w: 100, h: 140, label: 'BED' },
              { x: 140, y: 120, w: 120, h: 80, label: 'BATH' },
              { x: 260, y: 120, w: 100, h: 140, label: 'MASTER' },
              { x: 140, y: 200, w: 120, h: 60, label: 'DINING' },
            ].map((r, i) => (
            <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 + i * 0.15 }}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.4)" strokeWidth="1" />
              <text x={r.x + r.w / 2} y={r.y + r.h / 2} fill="rgba(74,144,217,0.7)" fontSize="9" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                {r.label}
              </text>
            </motion.g>
          ))}

          {[
              { x1: 40, y1: 120, x2: 160, y2: 120 },
              { x1: 160, y1: 40, x2: 160, y2: 120 },
              { x1: 160, y1: 120, x2: 360, y2: 120 },
              { x1: 140, y1: 120, x2: 140, y2: 260 },
              { x1: 40, y1: 200, x2: 260, y2: 200 },
              { x1: 260, y1: 120, x2: 260, y2: 260 },
              { x1: 140, y1: 200, x2: 260, y2: 200 },
            ].map((w, i) => (
            <motion.line key={`iw-${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
              stroke="rgba(74,144,217,0.5)" strokeWidth="1.5" className="arch-line"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 1.6 + i * 0.1 }}
            />
          ))}

          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
            <line x1="80" y1="40" x2="110" y2="40" stroke="#0a1929" strokeWidth="4" />
            <path d="M 80 40 A 15 15 0 0 1 95 55" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="200" y1="40" x2="230" y2="40" stroke="#0a1929" strokeWidth="4" />
          </motion.g>

          {[
              { x: 50, y: 45, w: 8, h: 3 },
              { x: 50, y: 125, w: 8, h: 3 },
              { x: 270, y: 125, w: 8, h: 3 },
              { x: 340, y: 45, w: 3, h: 8 },
              { x: 340, y: 200, w: 3, h: 8 },
            ].map((win, i) => (
            <motion.rect key={`win-${i}`} x={win.x} y={win.y} width={win.w} height={win.h}
              fill="none" stroke="rgba(74,144,217,0.8)" strokeWidth="1.5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 + i * 0.1 }}
            />
          ))}

          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}>
            <text x="380" y="260" fill="rgba(74,144,217,0.6)" fontSize="8" fontFamily="monospace">40'</text>
            <text x="365" y="155" fill="rgba(74,144,217,0.6)" fontSize="8" fontFamily="monospace" transform="rotate(90 365 155)">60'</text>
            <circle cx="380" cy="30" r="8" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="1" />
            <line x1="380" y1="30" x2="380" y2="22" stroke="rgba(74,144,217,0.8)" strokeWidth="1.5" />
            <text x="380" y="18" fill="rgba(74,144,217,0.6)" fontSize="7" fontFamily="monospace" textAnchor="middle">N</text>
          </motion.g>
        </svg>

        

      </div>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 blueprint-grid-fine opacity-30 grid-fade pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.1] text-balance"
              >
                Design Your Dream Space with{' '}
                <span className="bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent">AI</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg text-ink-500 leading-relaxed max-w-xl"
              >
                Create intelligent architectural floor plans in 2D with the power of AI. From plot to plan in minutes.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link to="/register" className="btn-primary text-base">
                  Start Designing <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/dashboard" className="btn-secondary text-base">
                  <Play className="w-5 h-5" /> Explore Projects
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex items-center gap-6 text-sm text-ink-400"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free to start</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 2D</span>
              </motion.div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">Everything you need to design</h2>
            <p className="text-ink-500 max-w-2xl mx-auto">Professional architectural tools powered by AI, built for modern design workflows.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="card p-6 group hover:shadow-lg hover:shadow-ink-900/5 transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-ink-900 group-hover:bg-accent-600 flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">How It Works</h2>
            <p className="text-ink-500 max-w-2xl mx-auto">From idea to architectural plan in four simple steps.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="card p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <s.icon className="w-5 h-5 text-ink-400" />
                  </div>
                  <h3 className="font-semibold text-ink-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-ink-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">From Idea to Architectural Floor Plan</h2>
              <p className="text-ink-300 leading-relaxed mb-6">
                Describe your requirements and create a precise 2D floor plan with AI. Edit rooms, walls, doors, windows, furniture, and dimensions in an interactive architectural editor.
              </p>
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-xl glass-dark">
                  <Ruler className="w-6 h-6 text-accent-400 mb-2" />
                  <h4 className="font-semibold text-white text-sm">
                    Professional 2D Plan
                  </h4>
                  <p className="text-xs text-ink-400 mt-1">
                    Precise architectural drawings with rooms, walls, doors, windows, and dimensions.
                  </p>
                </div>

                <div className="flex-1 p-4 rounded-xl glass-dark">
                  <Maximize className="w-6 h-6 text-accent-400 mb-2" />
                  <h4 className="font-semibold text-white text-sm">
                    Interactive Editing
                  </h4>
                  <p className="text-xs text-ink-400 mt-1">
                    Edit layouts, resize rooms, move elements, and refine your floor plan with ease.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-blueprint-line"
            >
              <div className="absolute inset-0 blueprint-grid" />
              <svg viewBox="0 0 300 225" className="relative w-full h-full">
                <motion.rect x="30" y="100" width="240" height="3" fill="rgba(74,144,217,0.3)"
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
                  style={{ transformOrigin: '30px 100px' }} />
                <motion.rect x="30" y="100" width="240" height="80" fill="rgba(74,144,217,0.08)" stroke="rgba(74,144,217,0.5)"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} />
                <motion.rect x="30" y="60" width="240" height="40" fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.6)"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }} />
                <motion.rect x="60" y="60" width="180" height="40" fill="rgba(74,144,217,0.25)" stroke="rgba(74,144,217,0.8)"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.1 }} />
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-100 text-ink-600 text-sm font-medium mb-4">
              <Cpu className="w-4 h-4" /> AI Architecture Engine
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">AI that understands architecture</h2>
            <p className="text-ink-500 max-w-2xl mx-auto">
              Our AI doesn't just draw boxes. It understands room relationships, circulation, natural light, and architectural conventions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: 'Spatial Intelligence', desc: 'AI arranges rooms based on relationships — kitchen near dining, bedrooms for privacy, bathrooms accessible.' },
              { icon: Maximize, title: 'Dimensional Accuracy', desc: 'Every wall, door, and window is dimensionally accurate. Measurements update as you modify.' },
              { icon: Wand2, title: 'Natural Language Editing', desc: 'Just type what you want. "Add a balcony", "Make the kitchen larger", "Add an attached bathroom."' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-8"
              >
                <item.icon className="w-8 h-8 text-accent-600 mb-4" />
                <h3 className="font-semibold text-ink-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h2 className="text-3xl font-bold text-ink-900 mb-6">Your projects, organized</h2>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-ink-700">{b}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 grid grid-cols-2 gap-4"
            >
              {['Modern Villa', '2BHK Apartment', 'Office Space', 'Studio Loft'].map((name, i) => (
                <motion.div
                  key={name}
                  whileHover={{ y: -4 }}
                  className="card p-4"
                >
                  <div className="h-24 blueprint-grid rounded-lg mb-3 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-blueprint-accent opacity-60" />
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-400">{i + 1} floor{i === 0 ? '' : 's'}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold mb-6 text-balance"
          >
            Ready to design your dream space?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-ink-300 text-lg mb-8"
          >
            Start creating intelligent architectural floor plans today. It's free to get started.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/register" className="btn-primary bg-white text-ink-900 hover:bg-ink-100">
              Start Designing <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary bg-transparent text-white border-ink-700 hover:bg-ink-800">
              Login
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
