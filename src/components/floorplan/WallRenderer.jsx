export default function WallRenderer({ walls, toScreen, scale }) {
  if (!walls || walls.length === 0) return null;

  const exteriorWalls = walls.filter((w) => w.type === 'exterior');
  const interiorWalls = walls.filter((w) => w.type !== 'exterior');

  return (
    <g className="architectural-walls" pointerEvents="none">
      {/* Interior partition walls */}
      <g className="interior-walls">
        {interiorWalls.map((wall, i) => {
          const p1 = toScreen(wall.x1, wall.y1);
          const p2 = toScreen(wall.x2, wall.y2);
          const thickness = Math.max(2, (Number(wall.thickness) || 0.5) * scale);
          return (
            <line
              key={wall.id || `int-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#1e293b"
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* Exterior perimeter walls */}
      <g className="exterior-walls">
        {exteriorWalls.map((wall, i) => {
          const p1 = toScreen(wall.x1, wall.y1);
          const p2 = toScreen(wall.x2, wall.y2);
          const thickness = Math.max(3, (Number(wall.thickness) || 0.8) * scale);
          return (
            <line
              key={wall.id || `ext-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#0f172a"
              strokeWidth={thickness}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          );
        })}
      </g>
    </g>
  );
}

