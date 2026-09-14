export default function FurnitureRenderer({
  furniture = [],
  fixtures = [],
  toScreen,
  scale,
  selectedId,
  onSelect,
  editable,
}) {
  const allItems = [...(furniture || []), ...(fixtures || [])];
  if (allItems.length === 0) return null;

  return (
    <g className="architectural-furniture">
      {allItems.map((item, i) => {
        const pos = toScreen(item.x, item.y);
        const rawW = Number(item.width);
const rawH = Number(item.depth);

const w = Math.max(8, Math.abs(Number.isFinite(rawW) ? rawW : 2) * scale);
const h = Math.max(8, Math.abs(Number.isFinite(rawH) ? rawH : 2) * scale);
        const isSelected = selectedId === item.id;
        const rotation = Number(item.rotation) || 0;

        return (
          <g
            key={item.id || `furn-${i}`}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${rotation}, ${w / 2}, ${h / 2})`}
            onClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              onSelect?.(item.id);
            }}
            style={{ cursor: editable ? 'pointer' : 'default' }}
            className="furniture-block"
          >
            {/* Architectural CAD Detail Rendering */}
            {renderCADSymbol(item.type, w, h, isSelected) || (
              /* Fallback CAD block for unrecognized items */
              <rect
                x="1"
                y="1"
                width={w - 2}
                height={h - 2}
                fill={isSelected ? '#eff6ff' : '#ffffff'}
                stroke={isSelected ? '#2563eb' : '#64748b'}
                strokeWidth={isSelected ? '1.2' : '0.8'}
                rx="1.5"
              />
            )}

            {/* Selection Outline & Corner Grips */}
            {isSelected && (
              <g pointerEvents="none">
                <rect
                  x="-2"
                  y="-2"
                  width={w + 4}
                  height={h + 4}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  rx="2"
                />
                <rect x="-3" y="-3" width="6" height="6" fill="#2563eb" />
                <rect x={w - 3} y="-3" width="6" height="6" fill="#2563eb" />
                <rect x="-3" y={h - 3} width="6" height="6" fill="#2563eb" />
                <rect x={w - 3} y={h - 3} width="6" height="6" fill="#2563eb" />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function renderCADSymbol(type = '', w, h, isSelected) {
  const t = type.toLowerCase();
  const strokeColor = isSelected ? '#1d4ed8' : '#64748b';
  const detailColor = isSelected ? '#3b82f6' : '#94a3b8';

  // 1. LIVING ROOM: SOFA
  if (t.includes('sofa') || t.includes('couch')) {
    const armW = Math.max(3, w * 0.12);
    const backD = Math.max(4, h * 0.28);
    const seatW = w - armW * 2;
    const numCushions = seatW > 45 ? 3 : 2;
    const cushionW = seatW / numCushions;

    return (
      <g pointerEvents="none">
        {/* Sofa Base Body */}
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={h - 2}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="2"
        />
        {/* Backrest */}
        <rect
          x={armW}
          y="1"
          width={seatW}
          height={backD}
          fill="#f1f5f9"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="1"
        />
        {/* Left Armrest */}
        <rect
          x="1"
          y="1"
          width={armW}
          height={h - 2}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="2"
        />
        {/* Right Armrest */}
        <rect
          x={w - armW - 1}
          y="1"
          width={armW}
          height={h - 2}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="2"
        />
        {/* Seat Cushions */}
        {Array.from({ length: numCushions }).map((_, idx) => (
          <rect
            key={idx}
            x={armW + idx * cushionW + 1}
            y={backD + 2}
            width={cushionW - 2}
            height={h - backD - 4}
            fill="#ffffff"
            stroke={detailColor}
            strokeWidth="0.6"
            rx="2"
          />
        ))}
      </g>
    );
  }

  // 2. LIVING ROOM: COFFEE TABLE
  if (t.includes('coffee table') || (t.includes('table') && !t.includes('dining'))) {
    return (
      <g pointerEvents="none">
        <rect
          x="3"
          y="3"
          width={w - 6}
          height={h - 6}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="3"
        />
        <line
          x1="6"
          y1="6"
          x2={w - 6}
          y2="6"
          stroke={detailColor}
          strokeWidth="0.5"
        />
      </g>
    );
  }

  // 3. LIVING ROOM: TV / MEDIA UNIT
  if (t.includes('tv') || t.includes('media') || t.includes('entertainment')) {
    return (
      <g pointerEvents="none">
        {/* Console shelf */}
        <rect
          x="2"
          y="2"
          width={w - 4}
          height={h - 4}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.7"
        />
        {/* Screen panel line */}
        <line
          x1={w * 0.15}
          y1={h / 2}
          x2={w * 0.85}
          y2={h / 2}
          stroke="#0f172a"
          strokeWidth="1.6"
        />
        {/* Stand feet */}
        <line
          x1={w * 0.4}
          y1={h / 2}
          x2={w * 0.6}
          y2={h / 2}
          stroke="#0f172a"
          strokeWidth="2.4"
        />
      </g>
    );
  }

  // 4. BEDROOM: DOUBLE BED / MASTER BED
  if (t.includes('master') || t.includes('double bed') || (t.includes('bed') && !t.includes('single'))) {
    const headD = Math.max(3, h * 0.12);
    const pillowW = Math.max(8, (w - 12) / 2);
    const pillowH = Math.max(5, h * 0.22);
    const duvetY = headD + pillowH + 5;

    return (
      <g pointerEvents="none">
        {/* Mattress Base */}
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={h - 2}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="1.5"
        />
        {/* Headboard */}
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={headD}
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="0.9"
        />
        {/* Left Pillow */}
        <rect
          x="4"
          y={headD + 3}
          width={pillowW}
          height={pillowH}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.7"
          rx="2"
        />
        <line
          x1={4 + pillowW * 0.2}
          y1={headD + 3 + pillowH / 2}
          x2={4 + pillowW * 0.8}
          y2={headD + 3 + pillowH / 2}
          stroke={detailColor}
          strokeWidth="0.5"
        />
        {/* Right Pillow */}
        <rect
          x={w - pillowW - 4}
          y={headD + 3}
          width={pillowW}
          height={pillowH}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.7"
          rx="2"
        />
        <line
          x1={w - pillowW - 4 + pillowW * 0.2}
          y1={headD + 3 + pillowH / 2}
          x2={w - pillowW - 4 + pillowW * 0.8}
          y2={headD + 3 + pillowH / 2}
          stroke={detailColor}
          strokeWidth="0.5"
        />
        {/* Duvet / Quilt fold line */}
        <line
          x1="2"
          y1={duvetY}
          x2={w - 2}
          y2={duvetY}
          stroke={strokeColor}
          strokeWidth="0.9"
        />
        {/* Duvet fold flap */}
        <rect
          x="2"
          y={duvetY}
          width={w - 4}
          height={Math.max(4, h * 0.1)}
          fill="#f1f5f9"
          stroke={detailColor}
          strokeWidth="0.5"
        />
      </g>
    );
  }

  // 5. BEDROOM: SINGLE BED
  if (t.includes('single bed') || t.includes('bed')) {
    const headD = Math.max(3, h * 0.12);
    const pillowW = Math.max(8, w - 8);
    const pillowH = Math.max(5, h * 0.22);
    const duvetY = headD + pillowH + 5;

    return (
      <g pointerEvents="none">
        {/* Mattress Base */}
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={h - 2}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="1.5"
        />
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={headD}
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="0.9"
        />
        <rect
          x="4"
          y={headD + 3}
          width={pillowW}
          height={pillowH}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.7"
          rx="2"
        />
        <line
          x1={2}
          y1={duvetY}
          x2={w - 2}
          y2={duvetY}
          stroke={strokeColor}
          strokeWidth="0.9"
        />
        <rect
          x="2"
          y={duvetY}
          width={w - 4}
          height={Math.max(4, h * 0.1)}
          fill="#f1f5f9"
          stroke={detailColor}
          strokeWidth="0.5"
        />
      </g>
    );
  }

  // 6. BEDROOM: WARDROBE / CLOSET
  if (t.includes('wardrobe') || t.includes('closet')) {
    return (
      <g pointerEvents="none">
        {/* CAD cross hatch / hanger line */}
        <line
          x1="2"
          y1={h / 2}
          x2={w - 2}
          y2={h / 2}
          stroke={strokeColor}
          strokeWidth="0.8"
          strokeDasharray="3 2"
        />
        {/* Sliding door panels */}
        <line
          x1={w / 2}
          y1="2"
          x2={w / 2}
          y2={h - 2}
          stroke={strokeColor}
          strokeWidth="0.9"
        />
        {/* Diagonal architectural closet crosses */}
        <line
          x1="3"
          y1="3"
          x2={w / 2 - 2}
          y2={h - 3}
          stroke={detailColor}
          strokeWidth="0.4"
          strokeDasharray="2 3"
        />
        <line
          x1={w / 2 + 2}
          y1="3"
          x2={w - 3}
          y2={h - 3}
          stroke={detailColor}
          strokeWidth="0.4"
          strokeDasharray="2 3"
        />
      </g>
    );
  }

  // 7. DINING: DINING TABLE & CHAIRS
  if (t.includes('dining')) {
    const chairDepth = Math.max(3, Math.min(6, h * 0.16));
    const chairWidth = Math.max(4, Math.min(12, w * 0.22));
    const tableY = chairDepth + 1;
    const tableH = Math.max(6, h - tableY * 2);

    return (
      <g pointerEvents="none">
        {/* Table Top */}
        <rect
          x="2"
          y={tableY}
          width={w - 4}
          height={tableH}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.9"
          rx="2"
        />
        {/* Center line / place settings */}
        <line
          x1="6"
          y1={h / 2}
          x2={w - 6}
          y2={h / 2}
          stroke={detailColor}
          strokeWidth="0.5"
          strokeDasharray="3 2"
        />
        {/* Top Chair 1 */}
        <rect
          x={w * 0.25 - chairWidth / 2}
          y="1"
          width={chairWidth}
          height={chairDepth}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.6"
          rx="1"
        />
        {/* Top Chair 2 */}
        <rect
          x={w * 0.75 - chairWidth / 2}
          y="1"
          width={chairWidth}
          height={chairDepth}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.6"
          rx="1"
        />
        {/* Bottom Chair 1 */}
        <rect
          x={w * 0.25 - chairWidth / 2}
          y={h - chairDepth - 1}
          width={chairWidth}
          height={chairDepth}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.6"
          rx="1"
        />
        {/* Bottom Chair 2 */}
        <rect
          x={w * 0.75 - chairWidth / 2}
          y={h - chairDepth - 1}
          width={chairWidth}
          height={chairDepth}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.6"
          rx="1"
        />
      </g>
    );
  }

  // 8. KITCHEN: COUNTER & ISLAND
  if (t.includes('counter') || t.includes('island')) {
    return (
      <g pointerEvents="none">
        {/* Front edge bullnose */}
        <line
          x1="1"
          y1="2"
          x2={w - 1}
          y2="2"
          stroke={strokeColor}
          strokeWidth="1.2"
        />
        {/* Integrated Sink (left side) */}
        {w >= 36 && (
          <g transform="translate(6, 4)">
            <rect
              x="0"
              y="0"
              width={Math.min(18, w * 0.35)}
              height={h - 8}
              fill="#f1f5f9"
              stroke={strokeColor}
              strokeWidth="0.7"
              rx="2"
            />
            <circle
              cx={Math.min(18, w * 0.35) / 2}
              cy={(h - 8) / 2}
              r="2"
              fill={detailColor}
            />
            {/* Faucet arc */}
            <path
              d={`M ${Math.min(18, w * 0.35) / 2 - 2} ${(h - 8) / 2} A 3 3 0 0 1 ${Math.min(18, w * 0.35) / 2 + 2} ${(h - 8) / 2}`}
              fill="none"
              stroke="#0f172a"
              strokeWidth="0.8"
            />
          </g>
        )}
        {/* Integrated Stove Cooktop (right side) */}
        {w >= 40 && (
          <g transform={`translate(${w - Math.min(20, w * 0.35) - 6}, 4)`}>
            <rect
              x="0"
              y="0"
              width={Math.min(20, w * 0.35)}
              height={h - 8}
              fill="#f8fafc"
              stroke={strokeColor}
              strokeWidth="0.7"
            />
            {/* 4 Cooktop burners */}
            <circle cx="4" cy="4" r="2.5" fill="none" stroke="#0f172a" strokeWidth="0.7" />
            <circle cx={Math.min(20, w * 0.35) - 4} cy="4" r="2.5" fill="none" stroke="#0f172a" strokeWidth="0.7" />
            <circle cx="4" cy={h - 12} r="2.5" fill="none" stroke="#0f172a" strokeWidth="0.7" />
            <circle cx={Math.min(20, w * 0.35) - 4} cy={h - 12} r="2.5" fill="none" stroke="#0f172a" strokeWidth="0.7" />
          </g>
        )}
      </g>
    );
  }

  // 9. KITCHEN: REFRIGERATOR
  if (t.includes('refrigerator') || t.includes('fridge')) {
    return (
      <g pointerEvents="none">
        {/* Split French door line */}
        <line
          x1={w / 2}
          y1="2"
          x2={w / 2}
          y2={h - 2}
          stroke={strokeColor}
          strokeWidth="0.9"
        />
        {/* Handles */}
        <line
          x1={w / 2 - 2}
          y1={h * 0.25}
          x2={w / 2 - 2}
          y2={h * 0.75}
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        <line
          x1={w / 2 + 2}
          y1={h * 0.25}
          x2={w / 2 + 2}
          y2={h * 0.75}
          stroke="#0f172a"
          strokeWidth="1.2"
        />
      </g>
    );
  }

  // 10. BATHROOM: WC (WATER CLOSET / TOILET)
  if (t.includes('wc') || t.includes('toilet')) {
    const tankH = Math.max(3, h * 0.28);
    return (
      <g pointerEvents="none">
        {/* Cistern Tank */}
        <rect
          x="2"
          y="2"
          width={w - 4}
          height={tankH}
          fill="#f1f5f9"
          stroke="#0f172a"
          strokeWidth="0.9"
          rx="1"
        />
        {/* Flush Button */}
        <circle cx={w / 2} cy={2 + tankH / 2} r="1.2" fill="#0f172a" />
        {/* Elongated Bowl */}
        <path
          d={`M ${w * 0.2} ${tankH + 2} L ${w * 0.2} ${h * 0.65} A ${w * 0.3} ${h * 0.32} 0 0 0 ${w * 0.8} ${h * 0.65} L ${w * 0.8} ${tankH + 2} Z`}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="0.9"
        />
        {/* Inner Water Ring */}
        <ellipse
          cx={w / 2}
          cy={tankH + (h - tankH) * 0.52}
          rx={w * 0.2}
          ry={(h - tankH) * 0.28}
          fill="none"
          stroke={detailColor}
          strokeWidth="0.6"
        />
      </g>
    );
  }

  // 11. BATHROOM: WASH BASIN / SINK
  if (t.includes('wash') || t.includes('basin') || t.includes('sink')) {
    return (
      <g pointerEvents="none">
        {/* Counter / Frame */}
        <rect
          x="2"
          y="2"
          width={w - 4}
          height={h - 4}
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="0.8"
          rx="2"
        />
        {/* Basin Inner Oval */}
        <ellipse
          cx={w / 2}
          cy={h / 2 + 1}
          rx={w * 0.36}
          ry={h * 0.32}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="0.8"
        />
        {/* Drain */}
        <circle cx={w / 2} cy={h / 2 + 1} r="1.5" fill="#0f172a" />
        {/* Faucet Tap */}
        <line
          x1={w / 2}
          y1="3"
          x2={w / 2}
          y2={h / 2 - 2}
          stroke="#0f172a"
          strokeWidth="1.2"
        />
      </g>
    );
  }

  // 12. BATHROOM: SHOWER
  if (t.includes('shower')) {
    return (
      <g pointerEvents="none">
        {/* Shower enclosure base */}
        <rect
          x="1"
          y="1"
          width={w - 2}
          height={h - 2}
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="1"
          rx="2"
        />
        {/* Floor drainage slope cross (CAD X) */}
        <line
          x1="2"
          y1="2"
          x2={w - 2}
          y2={h - 2}
          stroke={detailColor}
          strokeWidth="0.5"
        />
        <line
          x1={w - 2}
          y1="2"
          x2="2"
          y2={h - 2}
          stroke={detailColor}
          strokeWidth="0.5"
        />
        {/* Center Drain */}
        <circle cx={w / 2} cy={h / 2} r="2.5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
        <circle cx={w / 2} cy={h / 2} r="1" fill="#0f172a" />
      </g>
    );
  }

  // 13. BATHROOM: BATHTUB
  if (t.includes('bathtub') || t.includes('tub')) {
    return (
      <g pointerEvents="none">
        <rect
          x="2"
          y="2"
          width={w - 4}
          height={h - 4}
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="0.9"
          rx="6"
        />
        <circle cx={w - 6} cy={h / 2} r="2" fill="#0f172a" />
      </g>
    );
  }

  // 14. STORE / UTILITY: STORAGE SHELVES
  if (t.includes('store') || t.includes('utility') || t.includes('shelf') || t.includes('storage')) {
    const numShelves = Math.max(3, Math.floor(h / 6));
    const stepH = (h - 4) / numShelves;

    return (
      <g pointerEvents="none">
        {Array.from({ length: numShelves }).map((_, idx) => (
          <line
            key={idx}
            x1="2"
            y1={2 + idx * stepH}
            x2={w - 2}
            y2={2 + idx * stepH}
            stroke={strokeColor}
            strokeWidth="0.7"
          />
        ))}
      </g>
    );
  }

  // 15. OFFICE: STUDY DESK
  if (t.includes('desk') || t.includes('study')) {
    return (
      <g pointerEvents="none">
        {/* Desktop */}
        <rect
          x="2"
          y="2"
          width={w - 4}
          height={h - 4}
          fill="#f8fafc"
          stroke={strokeColor}
          strokeWidth="0.8"
          rx="1"
        />
        {/* Keyboard / Laptop outline */}
        <rect
          x={w / 2 - 6}
          y={h / 2 - 3}
          width="12"
          height="6"
          fill="#ffffff"
          stroke={detailColor}
          strokeWidth="0.6"
          rx="1"
        />
      </g>
    );
  }

  return null;
}

