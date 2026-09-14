import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronRight, ChevronLeft, Loader2, Compass, Plus, X,
  Home, Ruler, Building2, DoorOpen, Sparkles, ArrowRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { createProject, updateFloorPlan } from '../services/projectApi';
import { generateFloorPlan as generateLocalFloorPlan } from '../utils/floorPlanUtils';
import { generateFloorPlan as generateAIFloorPlan } from '../services/aiApi';

const ROOM_TYPES = [
  'Living Room', 'Kitchen', 'Dining Room', 'Bedroom', 'Master Bedroom',
  'Bathroom', 'Toilet', 'Balcony', 'Study', 'Store', 'Utility',
  'Puja Room', 'Garage', 'Other',
];

const EXAMPLE_REQUIREMENTS = [
  'Modern 3BHK house', 'East-facing plot', 'Large kitchen',
  'Master bedroom with attached bathroom', 'Car parking', 'Staircase',
  'Natural ventilation',
];

const STAGES = [
  'Analyzing plot dimensions...',
  'Planning room arrangement...',
  'Optimizing circulation...',
  'Placing doors and windows...',
  'Adding furniture...',
  'Calculating dimensions...',
  'Checking architectural consistency...',
  'Finalizing architectural plan...',
];

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [plotWidth, setPlotWidth] = useState(40);
  const [plotDepth, setPlotDepth] = useState(60);
  const [unit, setUnit] = useState('ft');
  const [floors, setFloors] = useState(2);
  const [rooms, setRooms] = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [requirements, setRequirements] = useState('');

  const steps = [
    { icon: Home, title: 'Project Information', desc: 'Name your project' },
    { icon: Ruler, title: 'Plot Information', desc: 'Set plot dimensions' },
    { icon: Building2, title: 'Building Requirements', desc: 'Number of floors' },
    { icon: DoorOpen, title: 'Rooms', desc: 'Select room types' },
    { icon: Sparkles, title: 'Additional Requirements', desc: 'Describe your vision' },
    { icon: Compass, title: 'Generate Plan', desc: 'AI creates your floor plan' },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return plotWidth > 0 && plotDepth > 0;
      case 2: return floors > 0;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const toggleRoom = (r) => {
    setRooms(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const addCustomRoom = () => {
    if (customRoom.trim() && !rooms.includes(customRoom.trim())) {
      setRooms(prev => [...prev, customRoom.trim()]);
      setCustomRoom('');
    }
  };

  const toggleRequirement = (req) => {
    const current = requirements;
    if (current.includes(req)) {
      setRequirements(current.replace(req, '').replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').trim());
    } else {
      setRequirements(current ? `${current}, ${req}` : req);
    }
  };

const handleGenerate = async () => {
  setGenerating(true);
  setError('');
  setStage(0);

  // Advance stage indicator smoothly while network request is in flight
  let currentStage = 0;
  const stageTimer = setInterval(() => {
    currentStage = Math.min(STAGES.length - 2, currentStage + 1);
    setStage(currentStage);
  }, 700);

  try {
    const projectData = {
      name: name.trim(),
      plot: {
        width: Number(plotWidth),
        depth: Number(plotDepth),
        unit,
      },
      floors: Number(floors),
      requirements: {
        rooms: rooms.map(r => ({ type: r, label: r })),
        description: requirements,
      },
    };

    const project = await createProject(projectData);
    let aiPlan = null;
    try {
      aiPlan = await generateAIFloorPlan(projectData);
    } catch (aiErr) {
      console.warn('AI generation failed, falling back to local engine:', aiErr);
    }

    const floorPlan = aiPlan?.floors
      ? {
          ...aiPlan,
          plot: {
            width: Number(plotWidth),
            depth: Number(plotDepth),
            unit,
          },
        }
      : generateLocalFloorPlan(projectData);

    setStage(STAGES.length - 1);
    clearInterval(stageTimer);

    await updateFloorPlan(project.id, floorPlan);

    navigate(`/editor?projectId=${project.id}`, { replace: true });
  } catch (err) {
    clearInterval(stageTimer);
    setError(err.message || 'Failed to create project. Please try again.');
    setGenerating(false);
    setStage(0);
  }
};


  if (generating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950">
        <div className="absolute inset-0 blueprint-grid opacity-40" />
        <div className="relative max-w-lg w-full px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-2xl bg-accent-600 flex items-center justify-center mx-auto mb-6"
            >
              <Compass className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Floor Plan</h2>
            <p className="text-ink-400 text-sm">Our AI is designing your architectural plan</p>
          </motion.div>

          <div className="space-y-3">
            {STAGES.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: i <= stage ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < stage ? 'bg-green-500' : i === stage ? 'bg-accent-500' : 'bg-ink-800'
                }`}>
                  {i < stage ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : i === stage ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-ink-500" />
                  )}
                </div>
                <span className={`text-sm font-medium ${i <= stage ? 'text-white' : 'text-ink-500'}`}>{s}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 h-1 bg-ink-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-300"
              animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="pt-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-ink-900">Create New Project</h1>
          <p className="text-ink-500 mt-1">Design a new architectural floor plan with AI.</p>
        </motion.div>

        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  i === step ? 'bg-ink-900 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-ink-100 text-ink-400'
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-ink-900' : 'text-ink-400'}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 rounded transition-colors ${i < step ? 'bg-green-500' : 'bg-ink-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            <X className="w-4 h-4" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-8"
          >
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Project Information</h2>
                <p className="text-ink-500 text-sm mb-6">Give your project a name to identify it.</p>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Project Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="My Dream House" className="input-field" autoFocus />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Plot Information</h2>
                <p className="text-ink-500 text-sm mb-6">Define your plot dimensions.</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Plot Width</label>
                    <input type="number" value={plotWidth} onChange={(e) => setPlotWidth(e.target.value)}
                      min="10" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Plot Depth</label>
                    <input type="number" value={plotDepth} onChange={(e) => setPlotDepth(e.target.value)}
                      min="10" className="input-field" />
                  </div>
                </div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Unit</label>
                <div className="flex gap-3">
                  {['ft', 'm'].map(u => (
                    <button key={u} onClick={() => setUnit(u)}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        unit === u ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}>
                      {u === 'ft' ? 'Feet (ft)' : 'Meters (m)'}
                    </button>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-ink-50 border border-ink-100">
                  <p className="text-sm text-ink-500">Plot size: <span className="font-semibold text-ink-900">{plotWidth}{unit} × {plotDepth}{unit}</span></p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Building Requirements</h2>
                <p className="text-ink-500 text-sm mb-6">How many floors does your building have?</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFloors(Math.max(1, floors - 1))} className="w-12 h-12 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-xl font-bold text-ink-700">
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <p className="text-5xl font-bold text-ink-900">{floors}</p>
                    <p className="text-sm text-ink-400 mt-1">{floors === 1 ? 'floor' : 'floors'}</p>
                  </div>
                  <button onClick={() => setFloors(Math.min(10, floors + 1))} className="w-12 h-12 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-xl font-bold text-ink-700">
                    +
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setFloors(n)}
                      className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                        floors === n ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}>
                      {n} {n === 1 ? 'Floor' : 'Floors'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Rooms</h2>
                <p className="text-ink-500 text-sm mb-6">Select the rooms you need in your plan.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ROOM_TYPES.map(r => (
                    <button key={r} onClick={() => toggleRoom(r)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        rooms.includes(r) ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}>
                      {rooms.includes(r) && <Check className="w-3.5 h-3.5 inline mr-1" />}{r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customRoom} onChange={(e) => setCustomRoom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRoom())}
                    placeholder="Add custom room..." className="input-field flex-1" />
                  <button onClick={addCustomRoom} className="btn-primary px-4">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {rooms.length > 0 && (
                  <p className="text-sm text-ink-400 mt-4">{rooms.length} room{rooms.length === 1 ? '' : 's'} selected</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Additional Requirements</h2>
                <p className="text-ink-500 text-sm mb-6">Describe any specific needs or preferences.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {EXAMPLE_REQUIREMENTS.map(req => (
                    <button key={req} onClick={() => toggleRequirement(req)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        requirements.includes(req) ? 'bg-accent-100 text-accent-700 border border-accent-300' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}>
                      {req}
                    </button>
                  ))}
                </div>
                <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe your requirements... e.g., Modern 3BHK house with east-facing plot, large kitchen, master bedroom with attached bathroom..."
                  rows={5} className="input-field resize-none" />
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-xl font-bold text-ink-900 mb-2">Generate Plan</h2>
                <p className="text-ink-500 text-sm mb-6">Review your settings and generate the floor plan.</p>
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Project Name', value: name },
                    { label: 'Plot Size', value: `${plotWidth}${unit} × ${plotDepth}${unit}` },
                    { label: 'Floors', value: floors },
                    { label: 'Rooms', value: rooms.length > 0 ? rooms.join(', ') : 'Default layout' },
                    { label: 'Requirements', value: requirements || 'None specified' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-ink-100 last:border-0">
                      <span className="text-sm text-ink-400">{item.label}</span>
                      <span className="text-sm font-semibold text-ink-900 text-right max-w-[60%] truncate">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleGenerate} className="btn-primary w-full text-base">
                  <Sparkles className="w-5 h-5" /> Generate Floor Plan
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step < 5 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
