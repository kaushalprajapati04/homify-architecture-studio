import { midpoint, formatArchitecturalDimension } from '../../utils/geometryUtils';

export default function DimensionRenderer({ dimensions = [], toScreen, plot }) {
  if (!dimensions || dimensions.length === 0) return null;

  const unit = plot?.unit || 'ft';

const visibleDimensions = dimensions.filter(
  (dim) =>
    dim.type?.includes('plot') ||
    dim.type?.includes('building')
);

return (
  <g className="architectural-dimensions" pointerEvents="none">
    {visibleDimensions.map((dim, i) => {
        const p1 = toScreen(dim.x1, dim.y1);
        const p2 = toScreen(dim.x2, dim.y2);
        const horizontal = Math.abs(dim.y2 - dim.y1) < 0.05;

        // Derive numeric length and formatted architectural dimension string
        const rawLength = Math.hypot(dim.x2 - dim.x1, dim.y2 - dim.y1);
        const formattedValue = formatArchitecturalDimension(rawLength, unit);

        const isMajor = dim.type?.includes('plot') || dim.type?.includes('building');
        const strokeColor = isMajor ? '#334155' : '#64748b';
        const textColor = isMajor ? '#0f172a' : '#334155';
        const fontSize = isMajor ? '7.5' : '6';

        // Stagger interior room dimensions at 30% / 70% to avoid colliding with center room labels
        const staggerRatio = isMajor ? 0.5 : (i % 2 === 0 ? 0.32 : 0.68);
        const badgeX = p1.x + (p2.x - p1.x) * staggerRatio;
        const badgeY = p1.y + (p2.y - p1.y) * staggerRatio;

        const badgeW = Math.max(22, formattedValue.length * 4.6 + 6);
        const badgeH = isMajor ? 10 : 8.5;

        return (
          <g key={dim.id || `dim-${i}`} className="dimension-mark">
            {/* Dimension Line */}
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={strokeColor}
              strokeWidth={isMajor ? '0.9' : '0.65'}
            />

            {/* 45° Architectural Slash Tick Marks */}
            {horizontal ? (
              <>
                {/* Tick 1 */}
                <line
                  x1={p1.x - 2.5}
                  y1={p1.y + 2.5}
                  x2={p1.x + 2.5}
                  y2={p1.y - 2.5}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  strokeLinecap="square"
                />
                {/* Extension Line 1 */}
                <line
                  x1={p1.x}
                  y1={p1.y - 3}
                  x2={p1.x}
                  y2={p1.y + 3}
                  stroke={strokeColor}
                  strokeWidth="0.5"
                />
                {/* Tick 2 */}
                <line
                  x1={p2.x - 2.5}
                  y1={p2.y + 2.5}
                  x2={p2.x + 2.5}
                  y2={p2.y - 2.5}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  strokeLinecap="square"
                />
                {/* Extension Line 2 */}
                <line
                  x1={p2.x}
                  y1={p2.y - 3}
                  x2={p2.x}
                  y2={p2.y + 3}
                  stroke={strokeColor}
                  strokeWidth="0.5"
                />
              </>
            ) : (
              <>
                {/* Vertical Tick 1 */}
                <line
                  x1={p1.x - 2.5}
                  y1={p1.y + 2.5}
                  x2={p1.x + 2.5}
                  y2={p1.y - 2.5}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  strokeLinecap="square"
                />
                <line
                  x1={p1.x - 3}
                  y1={p1.y}
                  x2={p1.x + 3}
                  y2={p1.y}
                  stroke={strokeColor}
                  strokeWidth="0.5"
                />
                {/* Vertical Tick 2 */}
                <line
                  x1={p2.x - 2.5}
                  y1={p2.y + 2.5}
                  x2={p2.x + 2.5}
                  y2={p2.y - 2.5}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  strokeLinecap="square"
                />
                <line
                  x1={p2.x - 3}
                  y1={p2.y}
                  x2={p2.x + 3}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth="0.5"
                />
              </>
            )}

            {/* Dimension Text Badge with opaque white background pill */}
            <rect
              x={badgeX - badgeW / 2}
              y={badgeY - badgeH / 2}
              width={badgeW}
              height={badgeH}
              rx="2"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            <text
              x={badgeX}
              y={badgeY}
              dominantBaseline="central"
              textAnchor="middle"
              fill={textColor}
              fontSize={fontSize}
              fontFamily="Arial, sans-serif"
              fontWeight="700"
              letterSpacing="0.2"
            >
              {formattedValue}
            </text>
          </g>
        );
      })}
    </g>
  );
}

