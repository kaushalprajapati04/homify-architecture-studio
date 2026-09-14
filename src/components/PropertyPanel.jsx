import { Settings, RotateCw, Maximize2, Trash2 } from 'lucide-react';

export default function PropertyPanel({ selected, onUpdate, onDelete }) {
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Settings className="w-8 h-8 text-ink-300 mb-3" />
        <p className="text-sm text-ink-400">Select an object to edit its properties</p>
      </div>
    );
  }

  const isRoom = selected.type && !selected.label?.includes(' ');
  const isFurniture = selected.label || selected.type;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-bold text-ink-900 text-sm mb-1">Properties</h3>
        <p className="text-xs text-ink-400">{selected.label || selected.type || 'Object'}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">X Position</label>
          <input
            type="number"
            value={Math.round(selected.x * 10) / 10}
            onChange={(e) => onUpdate({ ...selected, x: Number(e.target.value) })}
            className="input-field text-sm py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">Y Position</label>
          <input
            type="number"
            value={Math.round(selected.y * 10) / 10}
            onChange={(e) => onUpdate({ ...selected, y: Number(e.target.value) })}
            className="input-field text-sm py-2"
          />
        </div>
        {selected.width !== undefined && (
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">Width</label>
            <input
              type="number"
              value={Math.round(selected.width * 10) / 10}
              onChange={(e) => onUpdate({ ...selected, width: Number(e.target.value) })}
              className="input-field text-sm py-2"
            />
          </div>
        )}
        {selected.depth !== undefined && (
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">Depth</label>
            <input
              type="number"
              value={Math.round(selected.depth * 10) / 10}
              onChange={(e) => onUpdate({ ...selected, depth: Number(e.target.value) })}
              className="input-field text-sm py-2"
            />
          </div>
        )}
        {selected.rotation !== undefined && (
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">Rotation (°)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={selected.rotation}
                onChange={(e) => onUpdate({ ...selected, rotation: Number(e.target.value) })}
                className="input-field text-sm py-2"
              />
              <button
                onClick={() => onUpdate({ ...selected, rotation: ((selected.rotation || 0) + 90) % 360 })}
                className="px-3 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Delete Object
      </button>
    </div>
  );
}
