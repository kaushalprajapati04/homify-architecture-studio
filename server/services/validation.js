function rectsOverlap(a, b, padding = 0.1) {
  return (
    a.x < b.x + b.width - padding &&
    a.x + a.width > b.x + padding &&
    a.y < b.y + b.depth - padding &&
    a.y + a.depth > b.y + padding
  );
}

function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.depth
  );
}

function validateFloorPlan(floorPlan, requestedRooms = []) {
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

  floors.forEach((floor, fi) => {
    const floorLabel = floor.name || `Floor ${fi + 1}`;
    const building = floor.building || { x: 0, y: 0, width: plotW, depth: plotD };
    const bX = Number(building.x) || 0;
    const bY = Number(building.y) || 0;
    const bW = Number(building.width) || plotW;
    const bD = Number(building.depth) || plotD;

    // 1. Building inside plot
    if (bX < -0.01 || bY < -0.01 || bX + bW > plotW + 0.05 || bY + bD > plotD + 0.05) {
      issues.push(`${floorLabel}: Building footprint exceeds plot boundaries`);
    }
    if (bW <= 0 || bD <= 0) {
      issues.push(`${floorLabel}: Building footprint has non-positive dimensions`);
    }

    // Setbacks
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

    // 2. Room checks
    rooms.forEach((room) => {
      const rx = Number(room.x);
      const ry = Number(room.y);
      const rw = Number(room.width);
      const rd = Number(room.depth);
      const rLabel = room.label || room.name || room.type || 'Room';

      if (rw <= 0 || rd <= 0) {
        issues.push(`${floorLabel}: ${rLabel} has zero or negative dimensions (${rw} × ${rd})`);
      }

      if (rx < -0.01 || ry < -0.01 || rx + rw > plotW + 0.05 || ry + rd > plotD + 0.05) {
        issues.push(`${floorLabel}: ${rLabel} is outside the plot boundary`);
      }

      if (
        rx < bX - 0.1 ||
        ry < bY - 0.1 ||
        rx + rw > bX + bW + 0.1 ||
        ry + rd > bY + bD + 0.1
      ) {
        issues.push(`${floorLabel}: ${rLabel} extends outside the building footprint`);
      }
    });

    // 3. Room overlaps
    for (let i = 0; i < rooms.length; i += 1) {
      for (let j = i + 1; j < rooms.length; j += 1) {
        if (rectsOverlap(rooms[i], rooms[j], 0.15)) {
          const r1 = rooms[i].label || rooms[i].type || `Room ${i}`;
          const r2 = rooms[j].label || rooms[j].type || `Room ${j}`;
          issues.push(`${floorLabel}: Room overlap between ${r1} and ${r2}`);
        }
      }
    }

    // 4. Furniture and fixtures
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

    // 5. Multi-floor stairs
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

  // 6. Requested rooms
  if (requestedRooms && requestedRooms.length > 0) {
    const allPresentTypes = floors.flatMap((f) =>
      (f.rooms || []).map((r) => (r.type || r.label || '').toLowerCase())
    );
    requestedRooms.forEach((req) => {
      const reqType = (typeof req === 'string' ? req : req.type || req.label || '').toLowerCase();
      if (!reqType) return;
      const found = allPresentTypes.some((pt) => pt.includes(reqType) || reqType.includes(pt));
      if (!found) {
        issues.push(
          `Requested room "${typeof req === 'string' ? req : req.label || req.type}" was omitted from the plan`
        );
      }
    });
  }

  // 7. Space utilization and layout quality checks
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
    `${floorLabel}: Low building space utilization (${(coverage * 100).toFixed(1)}% of building footprint utilized)`
  );
}
    }
  });

  return issues;
}

function validateLayoutQuality(floorPlan) {
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

module.exports = {
  validateFloorPlan,
  validateLayoutQuality,
  rectsOverlap,
  pointInRect,
};

