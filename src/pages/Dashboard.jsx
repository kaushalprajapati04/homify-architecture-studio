import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutDashboard, Clock, Layers, Activity, Trash2, Pencil, X, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';
import { fetchProjects, deleteProject, renameProject } from '../services/projectApi';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleOpen = (id) => navigate(`/editor?projectId=${id}`);

  const handleRename = (project) => {
    setRenameTarget(project);
    setRenameValue(project.name);
  };

  const confirmRename = async () => {
    if (!renameValue.trim()) return;
    setActionLoading(true);
    try {
      await renameProject(renameTarget.id, renameValue.trim());
      setProjects(prev => prev.map(p => p.id === renameTarget.id ? { ...p, name: renameValue.trim() } : p));
      setRenameTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to rename project.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalProjects = projects.length;
  const recentProjects = [...projects].sort((a, b) =>
    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  ).slice(0, 4);
  const lastEdited = projects.length > 0
    ? new Date(Math.max(...projects.map(p => new Date(p.updated_at || p.created_at).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const activeDesigns = projects.filter(p => p.floor_plan && Object.keys(p.floor_plan).length > 0).length;

  const stats = [
    { icon: LayoutDashboard, label: 'Total Projects', value: totalProjects },
    { icon: Clock, label: 'Last Edited', value: lastEdited },
    { icon: Layers, label: 'Active Designs', value: activeDesigns },
    { icon: Activity, label: 'Recent', value: recentProjects.length },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-ink-900">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Designer'}
          </h1>
          <p className="text-ink-500 mt-1">Bring your next architectural idea to life.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-5 h-5 text-ink-400" />
              </div>
              <p className="text-2xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink-900">Your Projects</h2>
          <button onClick={() => navigate('/create-project')} className="btn-primary text-sm py-2.5">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-32 bg-ink-100" />
                <div className="p-4">
                  <div className="h-4 bg-ink-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-ink-100 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-ink-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="w-8 h-8 text-ink-400" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 mb-2">No projects yet</h3>
            <p className="text-ink-500 text-sm mb-6">Create your first architectural project to get started.</p>
            <button onClick={() => navigate('/create-project')} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Your First Project
            </button>
          </motion.div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={handleOpen}
                  onRename={handleRename}
                  onDelete={(proj) => setDeleteTarget(proj)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {renameTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setRenameTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-ink-900">Rename Project</h3>
                <button onClick={() => setRenameTarget(null)} className="p-1 rounded-lg hover:bg-ink-100">
                  <X className="w-5 h-5 text-ink-400" />
                </button>
              </div>
              <input
                type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                className="input-field mb-4" placeholder="Project name" autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setRenameTarget(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={confirmRename} disabled={actionLoading || !renameValue.trim()} className="btn-primary flex-1 disabled:opacity-60">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">Delete Project</h3>
              </div>
              <p className="text-ink-500 text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold text-ink-900">{deleteTarget.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={confirmDelete} disabled={actionLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
