export default function WindowRenderer({ windows, toScreen, scale }) {
  if (!windows || windows.length === 0) return null;

  return (
    <g className="architectural-windows">
      {windows.map((win, i) => {
        const p = toScreen(win.x, win.y);
        const w = (Number(win.width) || 4) * scale;
        const isVertical = win.wall === 'left' || win.wall === 'right';
        const wallThick = Math.max(3, 0.8 * scale);
        const isWide = (Number(win.width) || 4) >= 4.5;

        if (!isVertical) {
          // Horizontal window (top or bottom exterior wall)
          const isTop = win.wall === 'top';
          const sillY = isTop ? p.y - wallThick / 2 - 1.5 : p.y + wallThick / 2 + 1.5;
          const stoolY = isTop ? p.y + wallThick / 2 : p.y - wallThick / 2;

          return (
            <g key={win.id || `win-${i}`} className="window-symbol">
              {/* Wall cutout mask */}
              <rect
                x={p.x}
                y={p.y - wallThick / 2}
                width={w}
                height={wallThick}
                fill="#ffffff"
              />

              {/* Exterior window sill (projecting slightly beyond wall) */}
              <line
                x1={p.x - 2}
                y1={sillY}
                x2={p.x + w + 2}
                y2={sillY}
                stroke="#0f172a"
                strokeWidth="1.4"
                strokeLinecap="square"
              />

              {/* Interior stool line */}
              <line
                x1={p.x}
                y1={stoolY}
                x2={p.x + w}
                y2={stoolY}
                stroke="#334155"
                strokeWidth="0.9"
              />

              {/* Window jambs */}
              <line
                x1={p.x}
                y1={p.y - wallThick / 2}
                x2={p.x}
                y2={p.y + wallThick / 2}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              <line
                x1={p.x + w}
                y1={p.y - wallThick / 2}
                x2={p.x + w}
                y2={p.y + wallThick / 2}
                stroke="#0f172a"
                strokeWidth="1.2"
              />

              {/* Architectural double-glazing panes */}
              <line
                x1={p.x}
                y1={p.y - 1.5}
                x2={p.x + w}
                y2={p.y - 1.5}
                stroke="#2563eb"
                strokeWidth="1"
              />
              <line
                x1={p.x}
                y1={p.y + 1.5}
                x2={p.x + w}
                y2={p.y + 1.5}
                stroke="#2563eb"
                strokeWidth="1"
              />

              {/* Mullions */}
              {isWide ? (
                <>
                  <line
                    x1={p.x + w * 0.33}
                    y1={p.y - wallThick / 2}
                    x2={p.x + w * 0.33}
                    y2={p.y + wallThick / 2}
                    stroke="#0f172a"
                    strokeWidth="1.1"
                  />
                  <line
                    x1={p.x + w * 0.66}
                    y1={p.y - wallThick / 2}
                    x2={p.x + w * 0.66}
                    y2={p.y + wallThick / 2}
                    stroke="#0f172a"
                    strokeWidth="1.1"
                  />
                </>
              ) : (
                <line
                  x1={p.x + w / 2}
                  y1={p.y - wallThick / 2}
                  x2={p.x + w / 2}
                  y2={p.y + wallThick / 2}
                  stroke="#0f172a"
                  strokeWidth="1.1"
                />
              )}
            </g>
          );
        } else {
          // Vertical window (left or right exterior wall)
          const isLeft = win.wall === 'left';
          const sillX = isLeft ? p.x - wallThick / 2 - 1.5 : p.x + wallThick / 2 + 1.5;
          const stoolX = isLeft ? p.x + wallThick / 2 : p.x - wallThick / 2;

          return (
            <g key={win.id || `win-${i}`} className="window-symbol">
              {/* Wall cutout mask */}
              <rect
                x={p.x - wallThick / 2}
                y={p.y}
                width={wallThick}
                height={w}
                fill="#ffffff"
              />

              {/* Exterior window sill (projecting slightly beyond wall) */}
              <line
                x1={sillX}
                y1={p.y - 2}
                x2={sillX}
                y2={p.y + w + 2}
                stroke="#0f172a"
                strokeWidth="1.4"
                strokeLinecap="square"
              />

              {/* Interior stool line */}
              <line
                x1={stoolX}
                y1={p.y}
                x2={stoolX}
                y2={p.y + w}
                stroke="#334155"
                strokeWidth="0.9"
              />

              {/* Window jambs */}
              <line
                x1={p.x - wallThick / 2}
                y1={p.y}
                x2={p.x + wallThick / 2}
                y2={p.y}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              <line
                x1={p.x - wallThick / 2}
                y1={p.y + w}
                x2={p.x + wallThick / 2}
                y2={p.y + w}
                stroke="#0f172a"
                strokeWidth="1.2"
              />

              {/* Architectural double-glazing panes */}
              <line
                x1={p.x - 1.5}
                y1={p.y}
                x2={p.x - 1.5}
                y2={p.y + w}
                stroke="#2563eb"
                strokeWidth="1"
              />
              <line
                x1={p.x + 1.5}
                y1={p.y}
                x2={p.x + 1.5}
                y2={p.y + w}
                stroke="#2563eb"
                strokeWidth="1"
              />

              {/* Mullions */}
              {isWide ? (
                <>
                  <line
                    x1={p.x - wallThick / 2}
                    y1={p.y + w * 0.33}
                    x2={p.x + wallThick / 2}
                    y2={p.y + w * 0.33}
                    stroke="#0f172a"
                    strokeWidth="1.1"
                  />
                  <line
                    x1={p.x - wallThick / 2}
                    y1={p.y + w * 0.66}
                    x2={p.x + wallThick / 2}
                    y2={p.y + w * 0.66}
                    stroke="#0f172a"
                    strokeWidth="1.1"
                  />
                </>
              ) : (
                <line
                  x1={p.x - wallThick / 2}
                  y1={p.y + w / 2}
                  x2={p.x + wallThick / 2}
                  y2={p.y + w / 2}
                  stroke="#0f172a"
                  strokeWidth="1.1"
                />
              )}
            </g>
          );
        }
      })}
    </g>
  );
}

