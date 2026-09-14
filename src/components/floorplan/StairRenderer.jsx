export default function StairRenderer({ stairs, toScreen, scale }) {
  if (!stairs || stairs.length === 0) return null;

  return (
    <g className="architectural-stairs">
      {stairs.map((stair, i) => {
        const pos = toScreen(stair.x, stair.y);
        const w = (Number(stair.width) || 7) * scale;
        const h = (Number(stair.depth) || 10) * scale;
        const totalSteps = Number(stair.steps) || 14;
        const isDogLeg = w >= 38; // standard residential double-flight (dog-leg) staircase

        if (isDogLeg) {
          // Double flight / Dog-leg staircase with center handrail & landing
          const flightW = (w - 4) / 2;
          const landingD = Math.max(16, h * 0.25);
          const flightH = h - landingD;
          const stepsPerFlight = Math.max(4, Math.floor(totalSteps / 2));
          const stepH = flightH / stepsPerFlight;

          return (
            <g key={stair.id || `stair-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Stair enclosure base */}
              <rect
                x="0"
                y="0"
                width={w}
                height={h}
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="1.4"
              />

              {/* Landing Area (Top) */}
              <rect
                x="1"
                y="1"
                width={w - 2}
                height={landingD}
                fill="#f8fafc"
                stroke="#64748b"
                strokeWidth="0.8"
              />
              <text
                x={w / 2}
                y={landingD / 2 + 2}
                fill="#64748b"
                fontSize="6"
                fontFamily="Arial, sans-serif"
                fontWeight="600"
                textAnchor="middle"
                letterSpacing="0.5"
              >
                LANDING
              </text>

              {/* Central Well / Handrail Divider */}
              <rect
                x={w / 2 - 1.5}
                y={landingD}
                width="3"
                height={flightH}
                fill="#334155"
                stroke="#0f172a"
                strokeWidth="0.8"
              />

              {/* Left Flight Treads (Ascending) */}
              {Array.from({ length: stepsPerFlight }).map((_, s) => {
                const yPos = h - s * stepH;
                return (
                  <g key={`lf-${s}`}>
                    <line
                      x1="0"
                      y1={yPos}
                      x2={w / 2 - 1.5}
                      y2={yPos}
                      stroke="#0f172a"
                      strokeWidth="1.0"
                    />
                    {/* Nosing line */}
                    <line
                      x1="0"
                      y1={yPos - 1}
                      x2={w / 2 - 1.5}
                      y2={yPos - 1}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}

              {/* Right Flight Treads */}
              {Array.from({ length: stepsPerFlight }).map((_, s) => {
                const yPos = landingD + s * stepH;
                return (
                  <g key={`rf-${s}`}>
                    <line
                      x1={w / 2 + 1.5}
                      y1={yPos}
                      x2={w}
                      y2={yPos}
                      stroke="#0f172a"
                      strokeWidth="1.0"
                    />
                    <line
                      x1={w / 2 + 1.5}
                      y1={yPos + 1}
                      x2={w}
                      y2={yPos + 1}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}

              {/* Walking Flight Path (Left Flight going UP to landing) */}
              <g>
                {/* Starting Bullnose Dot */}
                <circle cx={flightW / 2} cy={h - 6} r="2.5" fill="#0f172a" />
                {/* Ascending Path */}
                <line
                  x1={flightW / 2}
                  y1={h - 6}
                  x2={flightW / 2}
                  y2={landingD + 6}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
                {/* Turn along landing */}
                <path
                  d={`M ${flightW / 2} ${landingD + 6} L ${flightW / 2} ${landingD / 2} L ${w - flightW / 2} ${landingD / 2} L ${w - flightW / 2} ${landingD + 12}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
                {/* Arrow Head */}
                <path
                  d={`M ${w - flightW / 2 - 3} ${landingD + 8} L ${w - flightW / 2} ${landingD + 14} L ${w - flightW / 2 + 3} ${landingD + 8}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.3"
                />
              </g>

              {/* UP label at bottom of flight */}
              <rect
                x={flightW / 2 - 9}
                y={h - 18}
                width="18"
                height="8"
                rx="1.5"
                fill="#ffffff"
                stroke="#64748b"
                strokeWidth="0.5"
              />
              <text
                x={flightW / 2}
                y={h - 12.5}
                fill="#0f172a"
                fontSize="6"
                fontFamily="Arial, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                UP
              </text>
            </g>
          );
        } else {
          // Straight Flight Staircase
          const numTreads = Math.max(8, totalSteps);
          const stepH = h / numTreads;

          return (
            <g key={stair.id || `stair-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Stringer Enclosure */}
              <rect
                x="0"
                y="0"
                width={w}
                height={h}
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="1.4"
              />

              {/* Individual Treads with Nosing */}
              {Array.from({ length: numTreads - 1 }).map((_, s) => {
                const yPos = (s + 1) * stepH;
                return (
                  <g key={s}>
                    <line
                      x1="0"
                      y1={yPos}
                      x2={w}
                      y2={yPos}
                      stroke="#0f172a"
                      strokeWidth="1.0"
                    />
                    <line
                      x1="0"
                      y1={yPos - 1}
                      x2={w}
                      y2={yPos - 1}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}

              {/* Center Walking Line with Arrow */}
              <circle cx={w / 2} cy={h - 6} r="2.5" fill="#0f172a" />
              <line
                x1={w / 2}
                y1={h - 6}
                x2={w / 2}
                y2="10"
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              <path
                d={`M ${w / 2 - 4} 16 L ${w / 2} 8 L ${w / 2 + 4} 16`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.4"
              />

              {/* Direction Indicator */}
              <rect
                x={w / 2 - 12}
                y={h / 2 - 5}
                width="24"
                height="10"
                rx="2"
                fill="#ffffff"
                stroke="#64748b"
                strokeWidth="0.6"
              />
              <text
                x={w / 2}
                y={h / 2 + 2}
                fill="#0f172a"
                fontSize="6"
                fontFamily="Arial, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                UP
              </text>
            </g>
          );
        }
      })}
    </g>
  );
}

