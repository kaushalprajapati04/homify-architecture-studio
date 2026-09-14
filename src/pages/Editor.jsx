import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Undo2, Redo2, Download, Save, LogOut, ChevronLeft,
  Ruler, Loader2, AlertCircle, Check,
  X, FileImage, FileText, Printer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProject, updateFloorPlan } from '../services/projectApi';
import { generateFloorPlan, modifyFloorPlan } from '../utils/floorPlanUtils';
import { modifyFloorPlan as aiModify } from '../services/aiApi';
import FloorPlan2D from '../components/floorplan/FloorPlan2D';
import EditorToolbar from '../components/EditorToolbar';
import FloorSelector from '../components/FloorSelector';
import AICommandPanel from '../components/AICommandPanel';
import PropertyPanel from '../components/PropertyPanel';

export default function Editor() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState(null);
  const [floorPlan, setFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFloor, setCurrentFloor] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedObj, setSelectedObj] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [recentCommands, setRecentCommands] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [zoom, setZoom] = useState(12);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
      return;
    }
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProject(projectId);
      if (!data) {
        setError('Project not found.');
        return;
      }
      setProject(data);
      let plan;
      if (data.floor_plan && Object.keys(data.floor_plan).length > 0) {
        plan = data.floor_plan;
        setFloorPlan(plan);
      } else {
        plan = generateFloorPlan({
          name: data.name,
          plot: { width: data.plot_width, depth: data.plot_depth, unit: data.plot_unit },
          floors: data.floors,
          requirements: { rooms: data.rooms, description: data.requirements },
        });
        setFloorPlan(plan);
        await updateFloorPlan(projectId, plan);
      }
      const pw = plan?.plot?.width || data.plot_width || 40;
      const pd = plan?.plot?.depth || data.plot_depth || 60;
      setZoom(calculateOptimalScale(pw, pd));
    } catch (err) {
      setError(err.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  const currentFloorData = floorPlan?.floors?.[currentFloor];

  const pushUndo = useCallback((oldPlan) => {
    undoStack.current.push(JSON.parse(JSON.stringify(oldPlan)));
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const updatePlan = useCallback((newPlan, skipSave = false) => {
    if (floorPlan) pushUndo(floorPlan);
    setFloorPlan(newPlan);
    setSaveStatus('unsaved');
    if (!skipSave) {
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateFloorPlan(projectId, newPlan);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('error');
        }
      }, 1500);
    }
  }, [floorPlan, projectId, pushUndo]);

  const handleUndo = () => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    redoStack.current.push(JSON.parse(JSON.stringify(floorPlan)));
    setFloorPlan(prev);
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await updateFloorPlan(projectId, prev); setSaveStatus('saved'); }
      catch { setSaveStatus('error'); }
    }, 1500);
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(JSON.parse(JSON.stringify(floorPlan)));
    setFloorPlan(next);
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await updateFloorPlan(projectId, next); setSaveStatus('saved'); }
      catch { setSaveStatus('error'); }
    }, 1500);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    if (!id) { setSelectedObj(null); return; }
    const floor = currentFloorData;
    const obj =
      floor?.rooms?.find(r => r.id === id) ||
      floor?.furniture?.find(f => f.id === id) ||
      floor?.fixtures?.find(f => f.id === id);
    setSelectedObj(obj || null);
  };

  const handleUpdateObject = (updated) => {
    if (!floorPlan || !updated?.id) return;
    const newPlan = JSON.parse(JSON.stringify(floorPlan));
    const floor = newPlan.floors[currentFloor];
    const collections = ['rooms', 'furniture', 'fixtures'];
    for (const col of collections) {
      const idx = floor[col]?.findIndex(item => item.id === updated.id);
      if (idx !== undefined && idx >= 0) {
        floor[col][idx] = updated;
        break;
      }
    }
    updatePlan(newPlan);
    setSelectedObj(updated);
  };

  const handleDeleteObject = () => {
    if (!selectedId || !floorPlan) return;
    const newPlan = JSON.parse(JSON.stringify(floorPlan));
    const floor = newPlan.floors[currentFloor];
    for (const col of ['rooms', 'furniture', 'fixtures']) {
      const idx = floor[col]?.findIndex(item => item.id === selectedId);
      if (idx !== undefined && idx >= 0) {
        floor[col].splice(idx, 1);
        break;
      }
    }
    updatePlan(newPlan);
    setSelectedId(null);
    setSelectedObj(null);
  };

  const handleAIApply = async (instruction) => {
    if (!floorPlan) return;
    setAiProcessing(true);
    setRecentCommands(prev => [instruction, ...prev].slice(0, 10));

    try {
      const apiResult = await aiModify(floorPlan, instruction);
      const newPlan = apiResult?.floors
        ? apiResult
        : modifyFloorPlan(floorPlan, instruction);

      updatePlan(newPlan);
    } catch (err) {
      const newPlan = modifyFloorPlan(floorPlan, instruction);
      updatePlan(newPlan);
    } finally {
      setAiProcessing(false);
    }
  };

  const canvasRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const calculateOptimalScale = (plotW, plotD) => {
    const w = Math.max(10, Number(plotW) || 40);
    const d = Math.max(10, Number(plotD) || 60);
    // Determine scale so drawing occupies 500-650px nicely in viewport
    const scaleForW = Math.floor(620 / w);
    const scaleForD = Math.floor(580 / d);
    return Math.max(6, Math.min(24, Math.min(scaleForW, scaleForD)));
  };

  const handleZoomIn = () => setZoom(z => Math.min(30, z + 2));
  const handleZoomOut = () => setZoom(z => Math.max(4, z - 2));
  const handleFit = () => {
    const plotW = floorPlan?.plot?.width || project?.plot_width || 40;
    const plotD = floorPlan?.plot?.depth || project?.plot_depth || 60;
    setZoom(calculateOptimalScale(plotW, plotD));
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'pan' || e.button === 1 || e.altKey) {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: canvasRef.current ? canvasRef.current.scrollLeft : 0,
        scrollTop: canvasRef.current ? canvasRef.current.scrollTop : 0,
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !canvasRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    canvasRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    canvasRef.current.scrollTop = dragStart.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = activeTool === 'pan' ? 'grab' : 'default';
      }
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom(z => Math.min(30, z + 1));
      } else {
        setZoom(z => Math.max(4, z - 1));
      }
    }
  };

  const handleExportSVG = () => {
    const svg = document.querySelector('.floor-plan-canvas svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'floor-plan'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleExportPNG = () => {
    const svg = document.querySelector('.floor-plan-canvas svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'floor-plan'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));
    setShowExport(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-ink-400" />
          <p className="text-sm text-ink-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink-900 mb-2">Error</h2>
          <p className="text-ink-500 mb-6">{error}</p>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!floorPlan) return null;

  return (
    <div className="h-screen flex flex-col bg-ink-50 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-ink-100 z-30">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-ink-600" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-ink-900">{project?.name || 'Untitled'}</span>
            <SaveStatus status={saveStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={undoStack.current.length === 0} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600 disabled:opacity-30 transition-colors" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} disabled={redoStack.current.length === 0} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600 disabled:opacity-30 transition-colors" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-ink-200 mx-1" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-100 text-ink-700 text-xs font-semibold">
            <Ruler className="w-3.5 h-3.5" /> 2D Architectural Plan
          </div>

          <div className="w-px h-6 bg-ink-200 mx-1" />

          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="btn-ghost text-sm py-1.5">
              <Download className="w-4 h-4" /> Export
            </button>
            <AnimatePresence>
              {showExport && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-ink-100 py-2 z-20"
                  >
                    <button onClick={handleExportSVG} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <FileImage className="w-4 h-4" /> Export SVG
                    </button>
                    <button onClick={handleExportPNG} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <FileText className="w-4 h-4" /> Export PNG
                    </button>
                    <button onClick={() => { window.print(); setShowExport(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 font-bold text-sm flex items-center justify-center">
              {(user?.email || 'U')[0].toUpperCase()}
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-ink-100 py-2 z-20"
                  >
                    <div className="px-4 py-2 border-b border-ink-100">
                      <p className="text-xs text-ink-400">Signed in as</p>
                      <p className="text-sm font-medium text-ink-900 truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
          <div className="w-14 flex-shrink-0">
            <EditorToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFit={handleFit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onDelete={handleDeleteObject}
              canUndo={undoStack.current.length > 0}
              canRedo={redoStack.current.length > 0}
              hasSelection={!!selectedId}
            />
          </div>
        

{/* Center Canvas */}
<div className="flex-1 flex flex-col overflow-hidden">
  <div className="flex-1 relative overflow-hidden bg-ink-950">
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full floor-plan-canvas flex items-center justify-center p-3 sm:p-5 overflow-auto"
      style={{ cursor: activeTool === 'pan' ? 'grab' : 'default' }}
    >
      <div
        className="min-w-max min-h-max flex items-center justify-center"
        style={{
          padding: '24px',
        }}
      >
        <FloorPlan2D
          floor={currentFloorData}
          plot={floorPlan.plot}
          projectName={project?.name || floorPlan?.projectName || 'Architectural Residence'}
          scale={zoom}
          selectedId={selectedId}
          onSelect={handleSelect}
          editable={true}
        />
      </div>
    </div>
  </div>
          {/* Floor Selector */}
          <FloorSelector
            floors={floorPlan.floors}
            currentFloor={currentFloor}
            onSelect={setCurrentFloor}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-ink-100 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {selectedObj ? (
              <PropertyPanel
                selected={selectedObj}
                onUpdate={handleUpdateObject}
                onDelete={handleDeleteObject}
              />
            ) : (
              <AICommandPanel
                onApply={handleAIApply}
                isProcessing={aiProcessing}
                recentCommands={recentCommands}
              />
            )}
          </div>
          {selectedObj && (
            <div className="border-t border-ink-100 p-2">
              <button
                onClick={() => { setSelectedId(null); setSelectedObj(null); }}
                className="w-full btn-ghost text-sm py-2"
              >
                <X className="w-4 h-4" /> Close Properties
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status }) {
  const config = {
    saved: { icon: Check, text: 'Saved', color: 'text-green-500' },
    saving: { icon: Loader2, text: 'Saving...', color: 'text-ink-400', spin: true },
    unsaved: { icon: Save, text: 'Unsaved changes', color: 'text-amber-500' },
    error: { icon: AlertCircle, text: 'Save failed', color: 'text-red-500' },
  };
  const c = config[status] || config.saved;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${c.color}`}>
      <c.icon className={`w-2.5 h-2.5 ${c.spin ? 'animate-spin' : ''}`} /> {c.text}
    </span>
  );
}
