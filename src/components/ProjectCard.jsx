import { motion } from 'framer-motion';
import { FolderOpen, Pencil, Trash2, Clock, Layers } from 'lucide-react';

function MiniFloorPlan({ floorPlan, plotWidth, plotDepth }) {
  if (!floorPlan || !floorPlan.floors || floorPlan.floors.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blueprint-bg rounded-lg">
        <span className="text-blueprint-accent text-[10px] font-mono opacity-60">No plan yet</span>
      </div>
    );
  }

  const floor = floorPlan.floors[0];
  const rooms = floor.rooms || [];
  const w = Math.max(10, Math.abs(Number(plotWidth) || 40));
  const d = Math.max(10, Math.abs(Number(plotDepth) || 60));
  const scale = 160 / Math.max(w, d);
  const offsetX = (180 - w * scale) / 2;
  const offsetY = (120 - d * scale) / 2;

  return (
    <div className="w-full h-full blueprint-grid rounded-lg overflow-hidden">
      <svg viewBox="0 0 180 120" className="w-full h-full">
        {rooms.map((r, i) => {
          const rawW = Number(r.width);
          const rawD = Number(r.depth);
          const wVal = Math.max(0.5, Math.abs(isNaN(rawW) ? 10 : rawW));
          const dVal = Math.max(0.5, Math.abs(isNaN(rawD) ? 10 : rawD));
          const rx = rawW < 0 ? (Number(r.x) || 0) - wVal : (Number(r.x) || 0);
          const ry = rawD < 0 ? (Number(r.y) || 0) - dVal : (Number(r.y) || 0);
          const rectW = Math.max(0.1, wVal * scale);
          const rectH = Math.max(0.1, dVal * scale);

          return (
            <rect
              key={r.id || i}
              x={offsetX + rx * scale}
              y={offsetY + ry * scale}
              width={rectW}
              height={rectH}
              fill="rgba(74, 144, 217, 0.12)"
              stroke="rgba(74, 144, 217, 0.6)"
              strokeWidth="0.5"
            />
          );
        })}
        {floor.walls?.slice(0, 4).map((w, i) => (
          <line
            key={i}
            x1={offsetX + (Number(w.x1) || 0) * scale}
            y1={offsetY + (Number(w.y1) || 0) * scale}
            x2={offsetX + (Number(w.x2) || 0) * scale}
            y2={offsetY + (Number(w.y2) || 0) * scale}
            stroke="rgba(74, 144, 217, 0.9)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}

export default function ProjectCard({ project, onOpen, onRename, onDelete }) {
  const updated = new Date(project.updated_at || project.created_at);
  const dateStr = updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden group cursor-pointer"
      onClick={() => onOpen(project.id)}
    >
      <div className="relative h-32 overflow-hidden border-b border-ink-100">
        <MiniFloorPlan
          floorPlan={project.floor_plan}
          plotWidth={project.plot_width}
          plotDepth={project.plot_depth}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md glass text-[10px] font-mono font-semibold text-ink-700">
          {project.plot_width}{project.plot_unit} × {project.plot_depth}{project.plot_unit}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-ink-900 truncate mb-1">{project.name}</h3>
        <div className="flex items-center gap-3 text-xs text-ink-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {project.floors} {project.floors === 1 ? 'floor' : 'floors'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(project.id); }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-ink-800 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Open
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRename(project); }}
            className="p-2 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
            aria-label="Rename project"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project); }}
            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
