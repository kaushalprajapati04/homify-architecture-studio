export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function midpoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function rotatePoint(px, py, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = px - cx;
  const dy = py - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.depth;
}

export function rectsOverlap(a, b, padding = 0) {
  return a.x < b.x + b.width - padding &&
    a.x + a.width > b.x + padding &&
    a.y < b.y + b.depth - padding &&
    a.y + a.depth > b.y + padding;
}

export function formatDimension(value, unit = 'ft') {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

export function formatArchitecturalDimension(value, unit = 'ft') {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return `${value}`;

  if (unit === 'm') {
    return `${(Math.round(num * 100) / 100).toFixed(2)}m`;
  }

  // Architectural feet and inches: e.g. 40'-0", 16'-6", 10'-3"
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  let feet = Math.floor(abs);
  let inches = Math.round((abs - feet) * 12);

  if (inches === 12) {
    feet += 1;
    inches = 0;
  }

  return `${sign}${feet}'-${inches}"`;
}

export function snapToGrid(value, gridSize = 1) {
  return Math.round(value / gridSize) * gridSize;
}

export function validateFloorPlan(floorPlan, requestedRooms = []) {
  const issues = [];
  const plot = floorPlan?.plot;
  if (!plot || !plot.width || !plot.depth) {
    return ['Missing or invalid plot dimensions'];
  }

  const plotW = Number(plot.width);
  const plotD = Number(plot.depth);

  if (plotW <= 0 || plotD <= 0) {
    issues.push('Plot dimensions must be strictly positive');
  }

  const floors = floorPlan.floors || [];
  if (floors.length === 0) {
    issues.push('Floor plan has no floors');
    return issues;
  }

  let groundStairs = null;
  let groundBuilding = null;

  floors.forEach((floor, fi) => {
    const floorLabel = floor.name || `Floor ${fi + 1}`;
    const building = floor.building || { x: 0, y: 0, width: plotW, depth: plotD };
    const bX = Number(building.x) || 0;
    const bY = Number(building.y) || 0;
    const bW = Number(building.width) || plotW;
    const bD = Number(building.depth) || plotD;

    if (fi === 0) {
      groundBuilding = { x: bX, y: bY, width: bW, depth: bD };
    }

    // 1. Building inside plot with reasonable setbacks
    if (bX < -0.01 || bY < -0.01 || bX + bW > plotW + 0.05 || bY + bD > plotD + 0.05) {
      issues.push(`${floorLabel}: Building footprint exceeds plot boundaries`);
    }
    if (bW <= 0 || bD <= 0) {
      issues.push(`${floorLabel}: Building footprint has non-positive dimensions`);
    }

    // Check setbacks
    const leftSetback = bX;
    const rightSetback = plotW - (bX + bW);
    const frontSetback = bY;
    const rearSetback = plotD - (bY + bD);
    if (leftSetback < -0.05 || rightSetback < -0.05 || frontSetback < -0.05 || rearSetback < -0.05) {
      issues.push(`${floorLabel}: Negative setback detected`);
    }

    const rooms = floor.rooms || [];
    if (rooms.length === 0) {
      issues.push(`${floorLabel}: No rooms found`);
    }

    // 2. Room checks: dimensions, containment inside building footprint, inside plot
    rooms.forEach((room) => {
      const rx = Number(room.x);
      const ry = Number(room.y);
      const rw = Number(room.width);
      const rd = Number(room.depth);
      const rLabel = room.label || room.name || room.type || 'Room';

      if (rw <= 0 || rd <= 0) {
        issues.push(`${floorLabel}: ${rLabel} has zero or negative dimensions (${rw} × ${rd})`);
      }

      // Check plot containment
      if (rx < -0.01 || ry < -0.01 || rx + rw > plotW + 0.05 || ry + rd > plotD + 0.05) {
        issues.push(`${floorLabel}: ${rLabel} is outside the plot boundary`);
      }

      // Check building containment
      if (
        rx < bX - 0.1 ||
        ry < bY - 0.1 ||
        rx + rw > bX + bW + 0.1 ||
        ry + rd > bY + bD + 0.1
      ) {
        issues.push(`${floorLabel}: ${rLabel} extends outside the building footprint`);
      }
    });

    // 3. Room overlap check
    for (let i = 0; i < rooms.length; i += 1) {
      for (let j = i + 1; j < rooms.length; j += 1) {
        if (rectsOverlap(rooms[i], rooms[j], 0.15)) {
          const r1 = rooms[i].label || rooms[i].type || `Room ${i}`;
          const r2 = rooms[j].label || rooms[j].type || `Room ${j}`;
          issues.push(`${floorLabel}: Room overlap between ${r1} and ${r2}`);
        }
      }
    }

    // 4. Furniture and fixtures containment inside rooms
    const allObjects = [...(floor.furniture || []), ...(floor.fixtures || [])];
    allObjects.forEach((obj) => {
      const ow = Number(obj.width) || 0;
      const od = Number(obj.depth) || 0;
      if (ow <= 0 || od <= 0) {
        issues.push(`${floorLabel}: Object ${obj.label || obj.type} has non-positive dimensions`);
      }
      const cx = (Number(obj.x) || 0) + ow / 2;
      const cy = (Number(obj.y) || 0) + od / 2;
      const owner = rooms.find((r) => pointInRect(cx, cy, r));
      if (!owner) {
        issues.push(`${floorLabel}: ${obj.label || obj.type} is placed outside any room`);
      }
    });

    // 5. Doors on room walls
    (floor.doors || []).forEach((door) => {
      const dw = Number(door.width) || 3;
      if (dw <= 0) {
        issues.push(`${floorLabel}: Door has non-positive width`);
      }
      const dx = Number(door.x);
      const dy = Number(door.y);
      const matchingRoom = rooms.find((r) => {
        const onTop = Math.abs(dy - r.y) < 0.3 && dx >= r.x - 0.2 && dx + dw <= r.x + r.width + 0.2;
        const onBottom = Math.abs(dy - (r.y + r.depth)) < 0.3 && dx >= r.x - 0.2 && dx + dw <= r.x + r.width + 0.2;
        const onLeft = Math.abs(dx - r.x) < 0.3 && dy >= r.y - 0.2 && dy + dw <= r.y + r.depth + 0.2;
        const onRight = Math.abs(dx - (r.x + r.width)) < 0.3 && dy >= r.y - 0.2 && dy + dw <= r.y + r.depth + 0.2;
        return onTop || onBottom || onLeft || onRight;
      });
      if (!matchingRoom && !door.isMainEntrance) {
        // Door should be close to some room wall
        const nearAnyRoom = rooms.some(
          (r) =>
            dx >= r.x - 1 &&
            dx <= r.x + r.width + 1 &&
            dy >= r.y - 1 &&
            dy <= r.y + r.depth + 1
        );
        if (!nearAnyRoom) {
          issues.push(`${floorLabel}: Door at (${dx}, ${dy}) is disconnected from room walls`);
        }
      }
    });

    // 6. Windows on exterior walls
    (floor.windows || []).forEach((win) => {
      const wx = Number(win.x);
      const wy = Number(win.y);
      const ww = Number(win.width) || 3;
      if (ww <= 0) {
        issues.push(`${floorLabel}: Window has non-positive width`);
      }
      const isExterior =
        Math.abs(wy - bY) < 0.5 ||
        Math.abs(wy - (bY + bD)) < 0.5 ||
        Math.abs(wx - bX) < 0.5 ||
        Math.abs(wx - (bX + bW)) < 0.5;
      if (!isExterior) {
        issues.push(`${floorLabel}: Window at (${wx}, ${wy}) is not placed on an exterior wall`);
      }
    });

    // 7. Multi-floor stairs tracking & vertical alignment
    const stairs = floor.stairs || [];
    if (stairs.length > 0) {
      const s = stairs[0];
      if (fi === 0) {
        groundStairs = s;
      } else if (groundStairs) {
        const dx = Math.abs(Number(s.x) - Number(groundStairs.x));
        const dy = Math.abs(Number(s.y) - Number(groundStairs.y));
        if (dx > 1.0 || dy > 1.0) {
          issues.push(`${floorLabel}: Staircase does not vertically align with ground floor stairs`);
        }
      }
    }
  });

  // 8. Check requested rooms are not silently omitted
  if (requestedRooms && requestedRooms.length > 0) {
    const allPresentTypes = floors.flatMap((f) => (f.rooms || []).map((r) => (r.type || r.label || '').toLowerCase()));
    requestedRooms.forEach((req) => {
      const reqType = (typeof req === 'string' ? req : req.type || req.label || '').toLowerCase();
      if (!reqType) return;
      const found = allPresentTypes.some((pt) => pt.includes(reqType) || reqType.includes(pt));
      if (!found) {
        issues.push(`Requested room "${typeof req === 'string' ? req : req.label || req.type}" was omitted from the plan`);
      }
    });
  }

  // 9. Space utilization and layout quality checks
  floors.forEach((floor, fi) => {
    const floorLabel = floor.name || `Floor ${fi + 1}`;
    const building = floor.building || { x: 0, y: 0, width: plotW, depth: plotD };
    const bY = Number(building.y) || 0;
    const bD = Number(building.depth) || plotD;
    const bW = Number(building.width) || plotW;
    const rooms = floor.rooms || [];

    if (rooms.length > 0) {
      const bBottom = bY + bD;
      const roomsMaxY = Math.max(...rooms.map((r) => (Number(r.y) || 0) + (Number(r.depth) || 0)));
      const emptyBottom = bBottom - roomsMaxY;

      if (emptyBottom > 3.5) {
        issues.push(
          `${floorLabel}: Excessive unused area at bottom of building (${emptyBottom.toFixed(1)} ft empty space)`
        );
      }

      const buildingArea = bW * bD;
      const totalRoomArea = rooms.reduce(
        (sum, r) => sum + (Number(r.width) || 0) * (Number(r.depth) || 0),
        0
      );
      const coverage = buildingArea > 0 ? totalRoomArea / buildingArea : 0;

      if (coverage < 0.75) {
        issues.push(
          `${floorLabel}: Low building space utilization (${(coverage * 100).toFixed(1)}% of building footprint utilized, minimum 75% required)`
        );
      }
    }
  });

  return issues;
}

export function validateLayoutQuality(floorPlan) {
  const issues = [];
  const plot = floorPlan?.plot;
  if (!plot) return { valid: false, issues: ['Missing plot'] };

  const plotW = Number(plot.width) || 40;
  const plotD = Number(plot.depth) || 60;
  const plotArea = plotW * plotD;

  const floor = floorPlan.floors?.[0];
  if (!floor) return { valid: false, issues: ['No floors found'] };

  const building = floor.building || {};
  const bW = Number(building.width) || plotW;
  const bD = Number(building.depth) || plotD;
  const bArea = bW * bD;

  const footprintRatio = bArea / plotArea;
  if (footprintRatio < 0.50 || footprintRatio > 0.80) {
    issues.push(`Building footprint ratio (${(footprintRatio * 100).toFixed(1)}%) outside expected 50-80% range`);
  }

  const rooms = floor.rooms || [];
  if (rooms.length === 0) {
    issues.push('No rooms in plan');
  } else {
    const bBottom = (Number(building.y) || 0) + bD;
    const roomsMaxY = Math.max(...rooms.map((r) => (Number(r.y) || 0) + (Number(r.depth) || 0)));
    const emptyBottom = bBottom - roomsMaxY;

    if (emptyBottom > 3.5) {
      issues.push(`Empty space at bottom of building is ${emptyBottom.toFixed(1)} ft (should be <= 3.5 ft)`);
    }

    const totalRoomArea = rooms.reduce((sum, r) => sum + (Number(r.width) || 0) * (Number(r.depth) || 0), 0);
    const utilization = totalRoomArea / bArea;
    if (utilization < 0.75) {
      issues.push(`Building space utilization is only ${(utilization * 100).toFixed(1)}% (minimum 75% required)`);
    }
  }

  return { valid: issues.length === 0, issues };
}
