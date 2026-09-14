import {
  MousePointer2, Hand, ZoomIn, ZoomOut, Maximize,
  Plus, Trash2, Undo2, Redo2, DoorOpen, AppWindow,
  Armchair, Ruler, DoorStairwell, Type, Pencil,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pan', icon: Hand, label: 'Pan' },
  { id: 'wall', icon: Pencil, label: 'Wall' },
  { id: 'door', icon: DoorOpen, label: 'Door' },
  { id: 'window', icon: AppWindow, label: 'Window' },
  { id: 'furniture', icon: Armchair, label: 'Furniture' },
  { id: 'stairs', icon: DoorStairwell, label: 'Stairs' },
  { id: 'dimension', icon: Ruler, label: 'Dimension' },
  { id: 'text', icon: Type, label: 'Text' },
];

export default function EditorToolbar({ activeTool, onToolChange, onZoomIn, onZoomOut, onFit, onUndo, onRedo, onDelete, canUndo, canRedo, hasSelection }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-white border-r border-ink-100 h-full overflow-y-auto scrollbar-thin">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative ${
            activeTool === tool.id
              ? 'bg-ink-900 text-white'
              : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
          }`}
          title={tool.label}
          aria-label={tool.label}
        >
          <tool.icon className="w-5 h-5" />
          <span className="absolute left-12 px-2 py-1 bg-ink-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {tool.label}
          </span>
        </button>
      ))}

      <div className="w-8 h-px bg-ink-200 my-1" />

      <button onClick={onZoomIn} className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-all" title="Zoom In">
        <ZoomIn className="w-5 h-5" />
      </button>
      <button onClick={onZoomOut} className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-all" title="Zoom Out">
        <ZoomOut className="w-5 h-5" />
      </button>
      <button onClick={onFit} className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-all" title="Fit to Screen">
        <Maximize className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-ink-200 my-1" />

      <button onClick={onUndo} disabled={!canUndo} className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
        <Undo2 className="w-5 h-5" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Redo">
        <Redo2 className="w-5 h-5" />
      </button>

      {hasSelection && (
        <>
          <div className="w-8 h-px bg-ink-200 my-1" />
          <button onClick={onDelete} className="w-10 h-10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all" title="Delete Selected">
            <Trash2 className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
