export default function DoorRenderer({ doors, toScreen, scale }) {
  if (!doors || doors.length === 0) return null;

  return (
    <g className="architectural-doors">
      {doors.map((door, i) => {
        const p = toScreen(door.x, door.y);
        const w = (Number(door.width) || 3) * scale;
        const isVertical = door.wall === 'left' || door.wall === 'right';
        const isDouble = door.type === 'double';
        const isMain = !!door.isMainEntrance;
        const wallThick = Math.max(3, 0.8 * scale);
        const leafThick = Math.max(1.8, 0.12 * scale);

        if (!isVertical) {
          // Horizontal Wall (top or bottom)
          const isTop = door.wall === 'top';
          const swingY = isTop ? 1 : -1; // swing down into room for top wall, up for bottom wall

          return (
            <g key={door.id || `door-${i}`} className="door-symbol">
              {/* Wall opening cutout mask */}
              <rect
                x={p.x}
                y={p.y - wallThick / 2}
                width={w}
                height={wallThick}
                fill="#ffffff"
              />

              {/* Door jamb stops */}
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

              {isDouble ? (
                // Double door
                <g>
                  {/* Left leaf & swing */}
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={p.y + (w / 2) * swingY}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x + w / 2} ${p.y} A ${w / 2} ${w / 2} 0 0 ${isTop ? 1 : 0} ${p.x} ${p.y + (w / 2) * swingY}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                  {/* Right leaf & swing */}
                  <line
                    x1={p.x + w}
                    y1={p.y}
                    x2={p.x + w}
                    y2={p.y + (w / 2) * swingY}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x + w / 2} ${p.y} A ${w / 2} ${w / 2} 0 0 ${isTop ? 0 : 1} ${p.x + w} ${p.y + (w / 2) * swingY}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                </g>
              ) : (
                // Single door
                <g>
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={p.y + w * swingY}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x + w} ${p.y} A ${w} ${w} 0 0 ${isTop ? 1 : 0} ${p.x} ${p.y + w * swingY}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                  {/* Hinge pivot */}
                  <circle cx={p.x} cy={p.y} r="1.5" fill="#0f172a" />
                </g>
              )}

              {/* Main Entrance Marker */}
              {isMain && (
                <g transform={`translate(${p.x + w / 2}, ${p.y - 12})`}>
                  <path d="M 0 8 L -4 0 L 4 0 Z" fill="#2563eb" />
                  <rect x="-24" y="-12" width="48" height="11" rx="2" fill="#2563eb" />
                  <text
                    x="0"
                    y="-4"
                    fill="#ffffff"
                    fontSize="6"
                    fontFamily="Arial, sans-serif"
                    fontWeight="700"
                    textAnchor="middle"
                    letterSpacing="0.5"
                  >
                    ENTRY
                  </text>
                </g>
              )}
            </g>
          );
        } else {
          // Vertical Wall (left or right)
          const isLeft = door.wall === 'left';
          const swingX = isLeft ? 1 : -1; // swing right into room for left wall, left for right wall

          return (
            <g key={door.id || `door-${i}`} className="door-symbol">
              {/* Wall opening cutout mask */}
              <rect
                x={p.x - wallThick / 2}
                y={p.y}
                width={wallThick}
                height={w}
                fill="#ffffff"
              />

              {/* Door jamb stops */}
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

              {isDouble ? (
                // Double door on vertical wall
                <g>
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x + (w / 2) * swingX}
                    y2={p.y}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x} ${p.y + w / 2} A ${w / 2} ${w / 2} 0 0 ${isLeft ? 0 : 1} ${p.x + (w / 2) * swingX} ${p.y}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                  <line
                    x1={p.x}
                    y1={p.y + w}
                    x2={p.x + (w / 2) * swingX}
                    y2={p.y + w}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x} ${p.y + w / 2} A ${w / 2} ${w / 2} 0 0 ${isLeft ? 1 : 0} ${p.x + (w / 2) * swingX} ${p.y + w}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                </g>
              ) : (
                // Single door on vertical wall
                <g>
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x + w * swingX}
                    y2={p.y}
                    stroke="#0f172a"
                    strokeWidth={leafThick}
                    strokeLinecap="square"
                  />
                  <path
                    d={`M ${p.x} ${p.y + w} A ${w} ${w} 0 0 ${isLeft ? 0 : 1} ${p.x + w * swingX} ${p.y}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 2"
                  />
                  <circle cx={p.x} cy={p.y} r="1.5" fill="#0f172a" />
                </g>
              )}
            </g>
          );
        }
      })}
    </g>
  );
}

