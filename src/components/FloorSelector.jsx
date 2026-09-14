import { Layers } from 'lucide-react';

export default function FloorSelector({ floors, currentFloor, onSelect }) {
  if (!floors || floors.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-ink-100">
      <Layers className="w-4 h-4 text-ink-400" />
      <span className="text-xs font-medium text-ink-500 mr-2">Floor:</span>
      <div className="flex gap-1">
        {floors.map((f, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentFloor === i
                ? 'bg-ink-900 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {f.name || (i === 0 ? 'Ground Floor' : `Floor ${i + 1}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
