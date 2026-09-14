import { useMemo } from 'react';
import WallRenderer from './WallRenderer';
import DoorRenderer from './DoorRenderer';
import WindowRenderer from './WindowRenderer';
import FurnitureRenderer from './FurnitureRenderer';
import DimensionRenderer from './DimensionRenderer';
import StairRenderer from './StairRenderer';
import { formatArchitecturalDimension } from '../../utils/geometryUtils';

export default function FloorPlan2D({
  floor,
  plot,
  projectName = 'Modern Residence',
  scale = 8,
  selectedId,
  onSelect,
  editable = false,
}) {
  const plotW = Math.max(10, Math.abs(Number(plot?.width) || 40));
  const plotD = Math.max(10, Math.abs(Number(plot?.depth) || 60));
  const unit = plot?.unit || 'ft';

  // Optimized CAD sheet margins to maximize drawing presentation without excess whitespace
  const marginLeft = 28;
  const marginRight = 36;
  const marginTop = 20;
  const marginBottom = 66;

  const plotWidthPx = Math.max(10, plotW * scale);
  const plotDepthPx = Math.max(10, plotD * scale);

  const totalWidth = plotWidthPx + marginLeft + marginRight;
  const totalHeight = plotDepthPx + marginTop + marginBottom;
  const viewBox = useMemo(() => `0 0 ${totalWidth} ${totalHeight}`, [totalWidth, totalHeight]);

  const offsetX = marginLeft;
  const offsetY = marginTop;

  const rawBw = Number(floor?.building?.width);
  const rawBd = Number(floor?.building?.depth);
  const bWidthVal = Math.max(1, Math.abs(isNaN(rawBw) ? (plotW - 5) : rawBw));
  const bDepthVal = Math.max(1, Math.abs(isNaN(rawBd) ? (plotD - 12) : rawBd));

  const building = floor?.building || {
    x: 2.5,
    y: 8,
    width: plotW - 5,
    depth: plotD - 12,
  };
  const rooms = floor?.rooms || [];

  const toScreen = (x, y) => ({
    x: offsetX + (Number(x) || 0) * scale,
    y: offsetY + (Number(y) || 0) * scale,
  });

  const bScreen = {
    x: offsetX + (Number(building.x) || 0) * scale,
    y: offsetY + (Number(building.y) || 0) * scale,
    w: Math.max(1, bWidthVal * scale),
    h: Math.max(1, bDepthVal * scale),
  };

  return (
    <svg
      viewBox={viewBox}
      className="architectural-drawing-sheet select-none w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      style={{
        aspectRatio: `${totalWidth} / ${totalHeight}`,
        background: '#ffffff',
        boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        display: 'block',
      }}
    >
      <defs>
        {/* Subtle CAD Background Grid */}
        <pattern id="cad-grid-fine" width={Math.max(1, scale)} height={Math.max(1, scale)} patternUnits="userSpaceOnUse">
          <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#f1f5f9" strokeWidth="0.4" />
        </pattern>
        <pattern id="cad-grid-major" width={Math.max(1, scale * 5)} height={Math.max(1, scale * 5)} patternUnits="userSpaceOnUse">
          <rect width={Math.max(1, scale * 5)} height={Math.max(1, scale * 5)} fill="url(#cad-grid-fine)" />
          <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
        </pattern>

        {/* Porch Paver Tile Pattern */}
        <pattern id="porch-pavers" width={Math.max(1, scale * 1.5)} height={Math.max(1, scale * 1.5)} patternUnits="userSpaceOnUse">
          <rect width={Math.max(1, scale * 1.5)} height={Math.max(1, scale * 1.5)} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* 1. Sheet Border & Drawing Area */}
      <rect x="2" y="2" width={Math.max(1, totalWidth - 4)} height={Math.max(1, totalHeight - 4)} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="5" y="5" width={Math.max(1, totalWidth - 10)} height={Math.max(1, totalHeight - 10)} fill="none" stroke="#0f172a" strokeWidth="0.75" />

      {/* 2. Plot Boundary / Property Line with CAD Grid */}
      <rect
        x={offsetX}
        y={offsetY}
        width={Math.max(1, plotWidthPx)}
        height={Math.max(1, plotDepthPx)}
        fill="url(#cad-grid-major)"
        stroke="#475569"
        strokeWidth="1.2"
        strokeDasharray="8 3 2 3"
      />

      {/* Setback Ground Indications */}
      {building.y > 4 && (
        <text
          x={offsetX + plotWidthPx / 2}
          y={offsetY + (building.y * scale) / 2 + 3}
          fill="#94a3b8"
          fontSize="6.5"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="1"
        >
          FRONT SETBACK / DRIVEWAY
        </text>
      )}

      {/* 3. Building Footprint Plinth / Foundation Slab */}
      <rect
        x={bScreen.x}
        y={bScreen.y}
        width={Math.max(1, bScreen.w)}
        height={Math.max(1, bScreen.h)}
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="1.6"
      />

      {/* 4. Room Floor Fills & Hover / Selection Handlers */}
      {rooms.map((room, i) => {
        const rawW = Number(room.width);
        const rawD = Number(room.depth);
        const wVal = Math.max(0.5, Math.abs(isNaN(rawW) ? 10 : rawW));
        const dVal = Math.max(0.5, Math.abs(isNaN(rawD) ? 10 : rawD));
        const rx = rawW < 0 ? (Number(room.x) || 0) - wVal : (Number(room.x) || 0);
        const ry = rawD < 0 ? (Number(room.y) || 0) - dVal : (Number(room.y) || 0);
        const p = toScreen(rx, ry);
        const w = Math.max(1, wVal * scale);
        const h = Math.max(1, dVal * scale);
        const selected = selectedId === room.id;
        const isPorch = /porch|veranda/i.test(room.type);

        return (
          <g
            key={room.id || `room-floor-${i}`}
            onClick={() => editable && onSelect?.(room.id)}
            style={{ cursor: editable ? 'pointer' : 'default' }}
            className="room-space"
          >
            <rect
              x={p.x}
              y={p.y}
              width={w}
              height={h}
              fill={selected ? '#eff6ff' : isPorch ? 'url(#porch-pavers)' : '#ffffff'}
              stroke={selected ? '#2563eb' : '#f1f5f9'}
              strokeWidth={selected ? 1.5 : 0.5}
            />
          </g>
        );
      })}

      {/* 5. Furniture & Fixtures Layer (Under Walls) */}
      <FurnitureRenderer
        furniture={floor?.furniture || []}
        fixtures={floor?.fixtures || []}
        toScreen={toScreen}
        scale={scale}
        selectedId={selectedId}
        onSelect={onSelect}
        editable={editable}
      />

      {/* 6. Stairs Layer */}
      <StairRenderer stairs={floor?.stairs || []} toScreen={toScreen} scale={scale} />

      {/* 7. Structural Walls Layer */}
      <WallRenderer walls={floor?.walls || []} toScreen={toScreen} scale={scale} />

      {/* 8. Window Openings Layer (Cuts through walls) */}
      <WindowRenderer windows={floor?.windows || []} toScreen={toScreen} scale={scale} />

      {/* 9. Door Openings & Leaves Layer (Cuts through walls) */}
      <DoorRenderer doors={floor?.doors || []} toScreen={toScreen} scale={scale} />

      {/* 10. Room Labels Layer (Prominent CAD Typography) */}
      {rooms.map((room, i) => {
        const rawW = Number(room.width);
        const rawD = Number(room.depth);
        const wVal = Math.max(0.5, Math.abs(isNaN(rawW) ? 10 : rawW));
        const dVal = Math.max(0.5, Math.abs(isNaN(rawD) ? 10 : rawD));
        const rx = rawW < 0 ? (Number(room.x) || 0) - wVal : (Number(room.x) || 0);
        const ry = rawD < 0 ? (Number(room.y) || 0) - dVal : (Number(room.y) || 0);
        const p = toScreen(rx, ry);
        const w = Math.max(1, wVal * scale);
        const h = Math.max(1, dVal * scale);
        const isBed = /bed|master/i.test(room.type);
        const isBath = /bath|toilet/i.test(room.type);
        const isLiving = /living|lounge/i.test(room.type);
        const isDining = /dining/i.test(room.type);
        const isKitchen = /kitchen/i.test(room.type);

        const wFormatted = formatArchitecturalDimension(wVal, unit);
        const dFormatted = formatArchitecturalDimension(dVal, unit);
        let roomTitle = (room.label || room.type || 'ROOM').toUpperCase();

        const isVerySmall = w < 45 || h < 40;
        const isSmall = w < 65 || h < 55;
        if (isVerySmall || isSmall) {
          if (roomTitle.includes('MASTER BEDROOM')) roomTitle = isVerySmall ? 'M. BED' : 'MASTER BED';
          else if (roomTitle.includes('BEDROOM') && !roomTitle.includes('MASTER')) roomTitle = isVerySmall ? 'BED' : roomTitle;
          else if (roomTitle.includes('BATHROOM') || roomTitle.includes('TOILET')) roomTitle = isVerySmall ? 'WC' : 'BATH';
          else if (roomTitle.includes('LIVING ROOM')) roomTitle = isVerySmall ? 'LIVING' : 'LIVING';
          else if (roomTitle.includes('DINING ROOM') || roomTitle.includes('DINING AREA')) roomTitle = 'DINING';
          else if (roomTitle.includes('UTILITY') || roomTitle.includes('WASH')) roomTitle = isVerySmall ? 'UTIL' : 'UTILITY';
          else if (roomTitle.includes('STAIRCASE') || roomTitle.includes('STAIRS')) roomTitle = isVerySmall ? 'STAIR' : 'STAIRS';
          else if (roomTitle.includes('STORE')) roomTitle = 'STORE';
          else if (roomTitle.includes('PORCH')) roomTitle = isVerySmall ? 'PORCH' : 'PORCH';
        }

        const titleSize = isVerySmall ? 5.5 : isSmall ? 6.5 : w > 120 ? 9 : 8;
        const subSize = isVerySmall ? 4.8 : isSmall ? 5.5 : 6.5;
        const showRoomDimensions = !isVerySmall;
        // Estimated text width and height
        const estTextW = Math.max(
          roomTitle.length * (titleSize * 0.62),
          (wFormatted.length + dFormatted.length + 3) * (subSize * 0.62)
        );
        const maxBadgeW = Math.max(20, w - 6);
        const maxBadgeH = Math.max(12, h - 4);
        const badgeW = Math.max(10, Math.min(maxBadgeW, estTextW + 8));
        const badgeH = Math.max(8, isVerySmall ? 13 : isSmall ? 15 : 18);

        // Smart vertical centering (avoiding beds at top, dining table at center, coffee table at bottom, etc.)
        let targetY = p.y + h * 0.5;
        if (isBed) {
          targetY = p.y + h * 0.65; // Clear foot of the bed
        } else if (isLiving) {
          targetY = p.y + h * 0.36; // Clear coffee table & sofa
        } else if (isDining) {
          targetY = p.y + h * 0.30; // Clear dining table
        } else if (isKitchen) {
          targetY = p.y + h * 0.55; // Clear top counter
        } else if (isBath) {
          targetY = p.y + h * 0.50; // Between top fixtures and bottom shower
        }

        // Clamp label center strictly inside room boundaries
        const labelX = Math.max(p.x + badgeW / 2 + 3, Math.min(p.x + w - badgeW / 2 - 3, p.x + w / 2));
        const labelY = Math.max(p.y + badgeH / 2 + 3, Math.min(p.y + h - badgeH / 2 - 3, targetY));

        return (
          <g key={room.id || `room-label-${i}`} pointerEvents="none" className="room-annotation">
            {/* Opaque badge pill to ensure text clarity */}
            <rect
              x={labelX - badgeW / 2}
              y={labelY - badgeH / 2}
              width={Math.max(1, badgeW)}
              height={Math.max(1, badgeH)}
              rx="2"
              fill="#ffffff"
              fillOpacity="0.94"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
            {/* Room Title */}
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0f172a"
              fontSize={titleSize}
              fontFamily="Arial, sans-serif"
              fontWeight="700"
              letterSpacing="0.3"
            >
              {roomTitle}
            </text>
          </g>
);
})}
      {/* 11. Architectural Dimensions Layer */}
      <DimensionRenderer
        dimensions={floor?.dimensions || []}
        toScreen={toScreen}
        scale={scale}
        plot={plot}
      />

      {/* 12. North Compass Rose */}
      <g transform={`translate(${offsetX + plotWidthPx + 16}, ${offsetY + 20})`}>
        <circle r="12" fill="#ffffff" stroke="#475569" strokeWidth="0.8" />
        <circle r="10" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
        {/* Needle */}
        <polygon points="0,-9 -2.5,0 0,1.5" fill="#0f172a" />
        <polygon points="0,-9 2.5,0 0,1.5" fill="#475569" />
        <polygon points="0,7.5 -2,0 0,-1" fill="#cbd5e1" />
        <polygon points="0,7.5 2,0 0,-1" fill="#94a3b8" />
        <text
          y="-11.5"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="7"
          fontFamily="Arial, sans-serif"
          fontWeight="800"
        >
          N
        </text>
      </g>

      {/* 13. Professional Graphic Scale Bar */}
      {(() => {
        const useCompact = plotW < 36;
        const segW = Math.max(1, scale * 5);
        const segW2 = Math.max(1, scale * 10);

        return (
          <g transform={`translate(${offsetX}, ${offsetY + plotDepthPx + 18})`}>
            {/* Scale segments: alternating black and white CAD blocks */}
            <rect x="0" y="0" width={segW} height="3" fill="#0f172a" stroke="#0f172a" strokeWidth="0.5" />
            <rect x={segW} y="0" width={segW} height="3" fill="#ffffff" stroke="#0f172a" strokeWidth="0.5" />
            {!useCompact && (
              <rect x={segW * 2} y="0" width={segW2} height="3" fill="#0f172a" stroke="#0f172a" strokeWidth="0.5" />
            )}

            {/* Vertical tick lines */}
            <line x1="0" y1="-2" x2="0" y2="5" stroke="#0f172a" strokeWidth="0.8" />
            <line x1={segW} y1="-2" x2={segW} y2="5" stroke="#0f172a" strokeWidth="0.8" />
            <line x1={segW * 2} y1="-2" x2={segW * 2} y2="5" stroke="#0f172a" strokeWidth="0.8" />
            {!useCompact && (
              <line x1={segW * 2 + segW2} y1="-2" x2={segW * 2 + segW2} y2="5" stroke="#0f172a" strokeWidth="0.8" />
            )}

            <text x="0" y="11" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="Arial, sans-serif">0</text>
            <text x={segW} y="11" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="Arial, sans-serif">5</text>
            <text x={segW * 2} y="11" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="Arial, sans-serif">{useCompact ? `10 ${unit}` : '10'}</text>
            {!useCompact && (
              <text x={segW * 2 + segW2} y="11" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="Arial, sans-serif">20 {unit}</text>
            )}

            <text x={useCompact ? segW : segW * 2} y="18" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="Arial, sans-serif" fontWeight="600" letterSpacing="0.5">
              GRAPHIC SCALE
            </text>
          </g>
        );
      })()}

      {/* 14. Professional CAD Title Block / Stamp */}
      {(() => {
        const tbWidth = Math.max(100, Math.min(210, Math.max(170, plotWidthPx * 0.54)));
        const tbHeight = 44;
        const tbX = offsetX + plotWidthPx - tbWidth;
        const tbY = offsetY + plotDepthPx + 16;
        const floorTitle = (floor?.name || 'Floor Plan').toUpperCase();
        const displayProjectName = (projectName || 'Modern Residence').toUpperCase();
        const sqft = plotW * plotD;

        return (
          <g transform={`translate(${tbX}, ${tbY})`}>
            {/* Title block frame */}
            <rect x="0" y="0" width={Math.max(1, tbWidth)} height={tbHeight} fill="#ffffff" stroke="#0f172a" strokeWidth="1" />

            {/* Header section background */}
            <rect x="0" y="0" width={Math.max(1, tbWidth)} height="14" fill="#f1f5f9" />
            <line x1="0" y1="14" x2={tbWidth} y2="14" stroke="#0f172a" strokeWidth="0.8" />

<text
  x="6"
  y="9.5"
  fill="#0f172a"
  fontSize="6.2"
  fontFamily="Arial, sans-serif"
  fontWeight="800"
  letterSpacing="0.5"
>
  HOMIFY
</text>

<text
  x={tbWidth / 2}
  y="9.5"
  textAnchor="middle"
  fill="#0f172a"
  fontSize="5.8"
  fontFamily="Arial, sans-serif"
  fontWeight="700"
  letterSpacing="0.4"
>
  ARCHITECTURE STUDIO
</text>

<text
  x={tbWidth - 6}
  y="9.5"
  textAnchor="end"
  fill="#2563eb"
  fontSize="5.8"
  fontFamily="Arial, sans-serif"
  fontWeight="700"
>
  {floorTitle}
</text>

            {/* Project Name Row */}
            <text x="6" y="22" fill="#64748b" fontSize="5.5" fontFamily="Arial, sans-serif" fontWeight="600">PROJECT:</text>
            <text x="36" y="22" fill="#0f172a" fontSize="6.8" fontFamily="Arial, sans-serif" fontWeight="700">
              {displayProjectName.length > 24 ? `${displayProjectName.slice(0, 22)}...` : displayProjectName}
            </text>

            {/* Plot Size and Area Row */}
            <text x="6" y="30" fill="#334155" fontSize="5.8" fontFamily="Arial, sans-serif" fontWeight="600">
              PLOT: {plotW} × {plotD} {unit}  •  AREA: {sqft.toLocaleString()} SQ FT
            </text>

            {/* Divider line before disclaimer */}
            <line x1="0" y1="34" x2={tbWidth} y2="34" stroke="#cbd5e1" strokeWidth="0.5" />

            {/* Preliminary Drawing Disclaimer */}
            <text
              x={tbWidth / 2}
              y="40"
              textAnchor="middle"
              fill="#64748b"
              fontSize="5.2"
              fontFamily="Arial, sans-serif"
              fontWeight="600"
              letterSpacing="0.3"
            >
              PRELIMINARY ARCHITECTURAL DRAWING • NOT FOR CONSTRUCTION
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

