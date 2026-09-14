const DEFAULT_WALL = 0.8;
const DEFAULT_INTERIOR_WALL = 0.5;
const EPS = 0.02;

function round(v) {
  return Math.round(v * 100) / 100;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function fmt(v) {
  return Number.isInteger(v) ? v : round(v);
}

export function calculateSetbacks(plotW, plotD) {
  let frontSetback, rearSetback, leftSetback, rightSetback;

  if (plotD >= 70) {
    frontSetback = clamp(Math.round(plotD * 0.18), 12, 16);
    rearSetback = clamp(Math.round(plotD * 0.08), 5, 8);
  } else if (plotD >= 50) {
    frontSetback = clamp(Math.round(plotD * 0.16), 9, 12);
    rearSetback = clamp(Math.round(plotD * 0.08), 4, 6);
  } else if (plotD >= 38) {
    frontSetback = clamp(Math.round(plotD * 0.15), 6, 8);
    rearSetback = clamp(Math.round(plotD * 0.08), 3, 5);
  } else {
    frontSetback = clamp(Math.round(plotD * 0.12), 4, 5);
    rearSetback = clamp(Math.round(plotD * 0.08), 2.5, 4);
  }

  if (plotW >= 60) {
    leftSetback = 4.0;
    rightSetback = 4.0;
  } else if (plotW >= 40) {
    leftSetback = 3.0;
    rightSetback = 3.0;
  } else if (plotW >= 28) {
    leftSetback = 2.5;
    rightSetback = 2.5;
  } else {
    leftSetback = 2.0;
    rightSetback = 2.0;
  }

  // Ensure building footprint width and depth are practical
  if (plotW - (leftSetback + rightSetback) < 18) {
    leftSetback = Math.max(1.5, (plotW - 18) / 2);
    rightSetback = leftSetback;
  }
  if (plotD - (frontSetback + rearSetback) < 22) {
    frontSetback = Math.max(3, (plotD - 22) * 0.6);
    rearSetback = Math.max(2, (plotD - 22) * 0.4);
  }

  return {
    front: round(frontSetback),
    rear: round(rearSetback),
    left: round(leftSetback),
    right: round(rightSetback),
  };
}

function categorizeRooms(requested, floorIndex, floorCount) {
  const isGround = floorIndex === 0;
  const isMultiFloor = floorCount > 1;

  const rawList = requested && requested.length > 0
    ? requested.map((r) => (typeof r === 'string' ? { type: r, label: r } : { type: r.type || r.name, label: r.label || r.name || r.type }))
    : null;

  let assigned = [];

  if (rawList && rawList.length > 0) {
    if (!isMultiFloor) {
      assigned = rawList;
    } else if (isGround) {
      // Ground floor in multi-floor home: public & semi-public, service, guest bed
      assigned = rawList.filter((r) => {
        const t = (r.type || '').toLowerCase();
        return /living|draw|foyer|porch|dining|kitchen|utility|store|puja|parking|garage/i.test(t);
      });
      // Ensure at least 1 bathroom and 1 bedroom/guest bed on ground floor if available in rawList
      const guestBed = rawList.find((r) => /guest|bed/i.test(r.type) && !assigned.includes(r));
      if (guestBed) assigned.push(guestBed);
      const bath = rawList.find((r) => /bath|toilet/i.test(r.type) && !assigned.includes(r));
      if (bath) assigned.push(bath);
      if (assigned.length === 0) assigned = rawList;
    } else {
      // Upper floor: private master suite, family lounge, secondary beds, baths, balcony
      assigned = rawList.filter((r) => {
        const t = (r.type || '').toLowerCase();
        return /master|bed|lounge|family|study|bath|balcony|terrace/i.test(t);
      });
      if (assigned.length === 0) {
        assigned = [
          { type: 'Master Bedroom', label: 'Master Bedroom' },
          { type: 'Bedroom', label: 'Bedroom 2' },
          { type: 'Bathroom', label: 'Attached Bath' },
          { type: 'Bathroom', label: 'Common Bath' },
          { type: 'Balcony', label: 'Front Balcony' },
        ];
      }
    }
  } else {
    // Default architectural configurations
    if (isGround) {
      assigned = isMultiFloor
        ? [
            { type: 'Living Room', label: 'Living Room' },
            { type: 'Dining Room', label: 'Dining Area' },
            { type: 'Kitchen', label: 'Kitchen' },
            { type: 'Bedroom', label: 'Guest Bedroom' },
            { type: 'Bathroom', label: 'Powder / Bath' },
          ]
        : [
            { type: 'Living Room', label: 'Living Room' },
            { type: 'Dining Room', label: 'Dining' },
            { type: 'Kitchen', label: 'Kitchen' },
            { type: 'Master Bedroom', label: 'Master Bedroom' },
            { type: 'Bedroom', label: 'Bedroom' },
            { type: 'Bathroom', label: 'Attached Bath' },
            { type: 'Bathroom', label: 'Common Bath' },
          ];
    } else {
      assigned = [
        { type: 'Master Bedroom', label: 'Master Suite' },
        { type: 'Bedroom', label: 'Bedroom 2' },
        { type: 'Living Room', label: 'Family Lounge' },
        { type: 'Bathroom', label: 'Master Bath' },
        { type: 'Bathroom', label: 'Common Bath' },
        { type: 'Balcony', label: 'Balcony' },
      ];
    }
  }

  // Ensure multi-floor has staircase room placeholder
  if (isMultiFloor && !assigned.some((r) => /stair/i.test(r.type))) {
    assigned.push({ type: 'Staircase', label: 'Staircase' });
  }

  return assigned;
}

function layoutFloorPlan(plotW, plotD, requestedRooms, floorIndex, floorCount) {
  const setbacks = calculateSetbacks(plotW, plotD);
  const bX = setbacks.left;
  const bY = setbacks.front;
  const bW = round(plotW - (setbacks.left + setbacks.right));
  const bD = round(plotD - (setbacks.front + setbacks.rear));
  const building = { x: bX, y: bY, width: bW, depth: bD };

  const isGround = floorIndex === 0;
  const hasStairs = floorCount > 1;

  let frontD, midD, rearD;
  if (bD >= 34) {
    frontD = round(clamp(bD * 0.33, 12, 16));
    midD = round(clamp(bD * 0.31, 10, 15));
    rearD = round(bD - (frontD + midD));
  } else if (bD >= 26) {
    frontD = round(clamp(bD * 0.34, 10, 12));
    midD = round(clamp(bD * 0.32, 9, 11));
    rearD = round(bD - (frontD + midD));
  } else {
    // Narrow / compact depth (bD < 26)
    frontD = round(clamp(bD * 0.36, 7.5, 9.5));
    midD = round(clamp(bD * 0.28, 6.0, 7.5));
    rearD = round(bD - (frontD + midD));
  }

  const rooms = [];
  let roomIdCounter = 0;
  let stairCoords = null;

  const reqNames = (requestedRooms || []).map((r) =>
    (typeof r === 'string' ? r : r.type || r.label || '').toLowerCase()
  );
  const hasReqStore = reqNames.some((n) => n.includes('store') || n.includes('utility'));
  const hasReqPorch = reqNames.some((n) => n.includes('porch') || n.includes('veranda'));

  if (bW < 22) {
    // TIER 1: NARROW ROW-HOUSE STRATEGY (bW < 22, e.g. 15x30 plot)
    const frontY = bY;
    const midY = round(frontY + frontD);
    const rearY = round(frontY + frontD + midD);

    if (isGround) {
      if (hasReqPorch) {
        const porchW = 4.5;
        const porchD = 4.5;
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Living Room', x: bX, y: frontY, width: round(bW - porchW), depth: frontD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Porch', label: 'Entrance Porch', x: round(bX + bW - porchW), y: frontY, width: porchW, depth: porchD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Store', label: hasReqStore ? 'Store' : 'Foyer', x: round(bX + bW - porchW), y: round(frontY + porchD), width: porchW, depth: round(frontD - porchD) });
      } else {
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Living Room', x: bX, y: frontY, width: bW, depth: frontD });
      }

      if (hasStairs) {
        const stairW = 4.5;
        stairCoords = { x: round(bX + bW - stairW), y: midY, width: stairW, depth: midD };
        const livingPartD = round(midD * 0.52);
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Dining Room', label: 'Dining Area', x: bX, y: midY, width: round(bW - stairW), depth: livingPartD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Kitchen', label: 'Kitchen', x: bX, y: round(midY + livingPartD), width: round(bW - stairW), depth: round(midD - livingPartD) });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + bW - stairW), y: midY, width: stairW, depth: midD });
      } else {
        const dinW = round(bW * 0.52);
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Dining Room', label: 'Dining Area', x: bX, y: midY, width: dinW, depth: midD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Kitchen', label: 'Kitchen', x: round(bX + dinW), y: midY, width: round(bW - dinW), depth: midD });
      }

      const bathW = round(clamp(bW * 0.38, 4.2, 5.0));
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Bedroom', x: bX, y: rearY, width: round(bW - bathW), depth: rearD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Bathroom', x: round(bX + bW - bathW), y: rearY, width: bathW, depth: rearD });
    } else {
      const balcW = 4.5;
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Family Lounge', x: bX, y: frontY, width: round(bW - balcW), depth: frontD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Balcony', label: 'Front Balcony', x: round(bX + bW - balcW), y: frontY, width: balcW, depth: frontD });

      const stairW = 4.5;
      stairCoords = { x: round(bX + bW - stairW), y: midY, width: stairW, depth: midD };
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 2', x: bX, y: midY, width: round(bW - stairW), depth: midD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + bW - stairW), y: midY, width: stairW, depth: midD });

      const bathW = round(clamp(bW * 0.38, 4.2, 5.0));
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Suite', x: bX, y: rearY, width: round(bW - bathW), depth: rearD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Master Bath', x: round(bX + bW - bathW), y: rearY, width: bathW, depth: rearD });
    }
  } else if (bW >= 28) {
    // TIER 3: LARGE RESIDENCE STRATEGY (bW >= 28, e.g. 40x60, 50x80)
    let wLeft = round(clamp(bW * 0.44, 13, 19));
    let wCenter = round(clamp(bW * 0.22, 6.5, 9));
    let wRight = round(bW - wLeft - wCenter);
    const frontY = bY;
    const midY = round(frontY + frontD);
    const rearY = round(frontY + frontD + midD);

    if (isGround) {
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Living Room', x: bX, y: frontY, width: round(wLeft + wCenter), depth: frontD });
      const porchD = round(clamp(frontD * 0.53, 6.0, frontD - 4.5));
      const storeD = round(frontD - porchD);
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Porch', label: 'Entrance Porch', x: round(bX + wLeft + wCenter), y: frontY, width: wRight, depth: porchD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Store', label: hasReqStore ? 'Store' : 'Foyer', x: round(bX + wLeft + wCenter), y: round(frontY + porchD), width: wRight, depth: storeD });

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Dining Room', label: 'Dining Area', x: bX, y: midY, width: wLeft, depth: midD });
      if (hasStairs) {
        stairCoords = { x: round(bX + wLeft), y: midY, width: wCenter, depth: midD };
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + wLeft), y: midY, width: wCenter, depth: midD });
      } else {
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Corridor', label: 'Central Hall', x: round(bX + wLeft), y: midY, width: wCenter, depth: midD });
      }
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Kitchen', label: 'Kitchen', x: round(bX + wLeft + wCenter), y: midY, width: wRight, depth: midD });

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Bedroom', x: bX, y: rearY, width: wLeft, depth: rearD });
      const bathD = round(clamp(rearD * 0.52, 6.0, 9));
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Bathroom', x: round(bX + wLeft), y: rearY, width: wCenter, depth: bathD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Utility', label: 'Wash / Dressing', x: round(bX + wLeft), y: round(rearY + bathD), width: wCenter, depth: round(rearD - bathD) });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 2', x: round(bX + wLeft + wCenter), y: rearY, width: wRight, depth: rearD });
    } else {
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Family Lounge', x: bX, y: frontY, width: round(wLeft + wCenter), depth: frontD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Balcony', label: 'Front Balcony', x: round(bX + wLeft + wCenter), y: frontY, width: wRight, depth: frontD });

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Study / Bed 3', x: bX, y: midY, width: wLeft, depth: midD });
      stairCoords = { x: round(bX + wLeft), y: midY, width: wCenter, depth: midD };
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + wLeft), y: midY, width: wCenter, depth: midD });
      const bathW = round(clamp(wRight * 0.52, 6.5, 8.0));
      const bed4W = round(wRight - bathW);
      const bathD = round(clamp(midD * 0.55, 6.5, 8.0));
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Common Bath', x: round(bX + wLeft + wCenter), y: midY, width: bathW, depth: bathD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Utility', label: 'Linen / Utility', x: round(bX + wLeft + wCenter), y: round(midY + bathD), width: bathW, depth: round(midD - bathD) });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 4', x: round(bX + wLeft + wCenter + bathW), y: midY, width: bed4W, depth: midD });

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Suite', x: bX, y: rearY, width: wLeft, depth: rearD });
      const bathD2 = round(clamp(rearD * 0.48, 6.0, 8.5));
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Master Bath', x: round(bX + wLeft), y: rearY, width: wCenter, depth: bathD2 });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Utility', label: 'Dressing', x: round(bX + wLeft), y: round(rearY + bathD2), width: wCenter, depth: round(rearD - bathD2) });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 2', x: round(bX + wLeft + wCenter), y: rearY, width: wRight, depth: rearD });
    }
  } else {
    // TIER 2: MEDIUM RESIDENCE STRATEGY (22 <= bW < 28, e.g. 30x40 where bW = 25)
    const frontY = bY;
    const midY = round(frontY + frontD);
    const rearY = round(frontY + frontD + midD);
    const livingW = round(clamp(bW * 0.58, 13.5, 16));
    const sideW = round(bW - livingW);
    const porchD = round(clamp(frontD * 0.52, 5.5, frontD - 4));
    const storeD = round(frontD - porchD);

    if (isGround) {
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Living Room', x: bX, y: frontY, width: livingW, depth: frontD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Porch', label: 'Entrance Porch', x: round(bX + livingW), y: frontY, width: sideW, depth: porchD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Store', label: 'Store', x: round(bX + livingW), y: round(frontY + porchD), width: sideW, depth: storeD });

      const dinW = round(bW * 0.52);
      const kitW = round(bW - dinW);
      if (hasStairs) {
        const stairW = round(clamp(kitW * 0.55, 6, 7.5));
        const finalKitW = round(kitW - stairW);
        stairCoords = { x: round(bX + dinW), y: midY, width: stairW, depth: midD };
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Dining Room', label: 'Dining Area', x: bX, y: midY, width: dinW, depth: midD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + dinW), y: midY, width: stairW, depth: midD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Kitchen', label: 'Kitchen', x: round(bX + dinW + stairW), y: midY, width: finalKitW, depth: midD });
      } else {
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Dining Room', label: 'Dining Area', x: bX, y: midY, width: dinW, depth: midD });
        rooms.push({ id: `room-${roomIdCounter++}`, type: 'Kitchen', label: 'Kitchen', x: round(bX + dinW), y: midY, width: kitW, depth: midD });
      }

      const bed1W = round(bW * 0.52);
      const bed2W = round(bW - bed1W);
      const bathD = round(clamp(rearD * 0.44, 5.5, 7.5));
      const bedD = round(rearD - bathD);
      const bathW = round(clamp(bed2W * 0.62, 6.0, 7.5));
      const utilW = round(bed2W - bathW);

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Bedroom', x: bX, y: rearY, width: bed1W, depth: rearD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 2', x: round(bX + bed1W), y: rearY, width: bed2W, depth: bedD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Bathroom', x: round(bX + bed1W), y: round(rearY + bedD), width: bathW, depth: bathD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Utility', label: 'Utility Niche', x: round(bX + bed1W + bathW), y: round(rearY + bedD), width: utilW, depth: bathD });
    } else {
      const loungeW = round(bW * 0.6);
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Living Room', label: 'Family Lounge', x: bX, y: frontY, width: loungeW, depth: frontD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Balcony', label: 'Front Balcony', x: round(bX + loungeW), y: frontY, width: round(bW - loungeW), depth: frontD });

      const dinW = round(bW * 0.52);
      const kitW = round(bW - dinW);
      const stairW = round(clamp(kitW * 0.55, 6, 7.5));
      const finalBathW = round(kitW - stairW);
      stairCoords = { x: round(bX + dinW), y: midY, width: stairW, depth: midD };

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Study / Bed 3', x: bX, y: midY, width: dinW, depth: midD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Staircase', label: 'Staircase', x: round(bX + dinW), y: midY, width: stairW, depth: midD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Common Bath', x: round(bX + dinW + stairW), y: midY, width: finalBathW, depth: midD });

      const bed1W = round(bW * 0.52);
      const bed2W = round(bW - bed1W);
      const bathD = round(clamp(rearD * 0.44, 5.5, 7.5));
      const bedD = round(rearD - bathD);
      const bathW = round(clamp(bed2W * 0.62, 6.0, 7.5));
      const utilW = round(bed2W - bathW);

      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Master Bedroom', label: 'Master Suite', x: bX, y: rearY, width: bed1W, depth: rearD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bedroom', label: 'Bedroom 2', x: round(bX + bed1W), y: rearY, width: bed2W, depth: bedD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Bathroom', label: 'Master Bath', x: round(bX + bed1W), y: round(rearY + bedD), width: bathW, depth: bathD });
      rooms.push({ id: `room-${roomIdCounter++}`, type: 'Utility', label: 'Dressing', x: round(bX + bed1W + bathW), y: round(rearY + bedD), width: utilW, depth: bathD });
    }
  }

  // Generate architectural walls
  const walls = generateWalls(rooms, building);
  const doors = generateDoors(rooms, building, floorIndex);
  const windows = generateWindows(rooms, building, doors);
  const furniture = generateFurniture(rooms);
  const fixtures = generateFixtures(rooms);
  const stairs = hasStairs ? generateStairs(rooms, building, stairCoords, floorIndex) : [];
  const dimensions = generateDimensions(rooms, building, plotW, plotD);

  return {
    floor: floorIndex,
    name: floorIndex === 0 ? 'Ground Floor' : `Floor ${floorIndex + 1}`,
    building,
    rooms,
    walls,
    doors,
    windows,
    furniture,
    fixtures,
    stairs,
    dimensions,
    electrical: [],
  };
}

function generateWalls(rooms, building) {
  const walls = [
    { id: 'ext-top', x1: building.x, y1: building.y, x2: round(building.x + building.width), y2: building.y, thickness: DEFAULT_WALL, type: 'exterior' },
    { id: 'ext-right', x1: round(building.x + building.width), y1: building.y, x2: round(building.x + building.width), y2: round(building.y + building.depth), thickness: DEFAULT_WALL, type: 'exterior' },
    { id: 'ext-bottom', x1: building.x, y1: round(building.y + building.depth), x2: round(building.x + building.width), y2: round(building.y + building.depth), thickness: DEFAULT_WALL, type: 'exterior' },
    { id: 'ext-left', x1: building.x, y1: building.y, x2: building.x, y2: round(building.y + building.depth), thickness: DEFAULT_WALL, type: 'exterior' },
  ];

  // Interior partition walls between touching room borders
  rooms.forEach((a, i) => {
    rooms.slice(i + 1).forEach((b) => {
      const vTouch = Math.abs(a.x + a.width - b.x) < EPS || Math.abs(b.x + b.width - a.x) < EPS;
      const hTouch = Math.abs(a.y + a.depth - b.y) < EPS || Math.abs(b.y + b.depth - a.y) < EPS;

      if (vTouch) {
        const x = Math.abs(a.x + a.width - b.x) < EPS ? a.x + a.width : b.x + b.width;
        const y1 = Math.max(a.y, b.y);
        const y2 = Math.min(a.y + a.depth, b.y + b.depth);
        if (y2 - y1 > 0.5) {
          walls.push({
            id: `int-v-${i}-${b.id}`,
            x1: round(x),
            y1: round(y1),
            x2: round(x),
            y2: round(y2),
            thickness: DEFAULT_INTERIOR_WALL,
            type: 'interior',
          });
        }
      } else if (hTouch) {
        const y = Math.abs(a.y + a.depth - b.y) < EPS ? a.y + a.depth : b.y + b.depth;
        const x1 = Math.max(a.x, b.x);
        const x2 = Math.min(a.x + a.width, b.x + b.width);
        if (x2 - x1 > 0.5) {
          walls.push({
            id: `int-h-${i}-${b.id}`,
            x1: round(x1),
            y1: round(y),
            x2: round(x2),
            y2: round(y),
            thickness: DEFAULT_INTERIOR_WALL,
            type: 'interior',
          });
        }
      }
    });
  });

  return walls;
}

function generateDoors(rooms, building, floorIndex) {
  const doors = [];
  rooms.forEach((room, i) => {
    const isLiving = /living|foyer|porch/i.test(room.type);
    const isBath = /bath|toilet/i.test(room.type);
    const isMain = floorIndex === 0 && i === 0;

    const width = isMain ? 3.5 : isBath ? 2.5 : 3.0;

    // Pick wall closest to interior circulation (or top if main entrance)
    let wall = 'bottom';
    let x = room.x + 1.0;
    let y = room.y + room.depth;

    if (isMain) {
      wall = 'top';
      x = room.x + 1.5;
      y = room.y;
    } else if (isBath) {
      // Bath opens on interior vertical partition wall or front
      wall = room.x > building.x + 2 ? 'left' : 'top';
      if (wall === 'left') {
        x = room.x;
        y = room.y + 0.8;
      } else {
        x = room.x + 0.6;
        y = room.y;
      }
    } else {
      // Bedroom / Kitchen / Dining door
      if (room.y > building.y + building.depth * 0.5) {
        wall = 'top';
        x = room.x + 1.0;
        y = room.y;
      } else {
        wall = 'bottom';
        x = room.x + 1.0;
        y = room.y + room.depth;
      }
    }

    doors.push({
      id: `door-${i}`,
      roomId: room.id,
      wall,
      x: round(x),
      y: round(y),
      width,
      height: 0.15,
      type: isMain ? 'double' : 'single',
      swing: 'in',
      hinge: 'left',
      isMainEntrance: isMain,
    });
  });

  return doors;
}

function generateWindows(rooms, building, doors) {
  const windows = [];
  let winId = 0;

  rooms.forEach((room) => {
    const bTop = Math.abs(room.y - building.y) < EPS;
    const bBottom = Math.abs(room.y + room.depth - (building.y + building.depth)) < EPS;
    const bLeft = Math.abs(room.x - building.x) < EPS;
    const bRight = Math.abs(room.x + room.width - (building.x + building.width)) < EPS;

    const isBath = /bath|toilet/i.test(room.type);
    const winW = isBath ? 2.2 : clamp(room.width * 0.35, 3.5, 5.5);

    if (bTop && !doors.some((d) => d.roomId === room.id && d.wall === 'top')) {
      windows.push({
        id: `win-${winId++}`,
        x: round(room.x + (room.width - winW) / 2),
        y: round(room.y),
        width: round(winW),
        height: 0.15,
        wall: 'top',
      });
    }
    if (bBottom && !doors.some((d) => d.roomId === room.id && d.wall === 'bottom')) {
      windows.push({
        id: `win-${winId++}`,
        x: round(room.x + (room.width - winW) / 2),
        y: round(room.y + room.depth),
        width: round(winW),
        height: 0.15,
        wall: 'bottom',
      });
    }
    if (bLeft) {
      windows.push({
        id: `win-${winId++}`,
        x: round(room.x),
        y: round(room.y + (room.depth - winW) / 2),
        width: round(winW),
        height: 0.15,
        wall: 'left',
      });
    }
    if (bRight) {
      windows.push({
        id: `win-${winId++}`,
        x: round(room.x + room.width),
        y: round(room.y + (room.depth - winW) / 2),
        width: round(winW),
        height: 0.15,
        wall: 'right',
      });
    }
  });

  return windows;
}

function generateFurniture(rooms) {
  const items = [];
  rooms.forEach((r, i) => {
    const cx = r.x + r.width / 2;
    const cy = r.y + r.depth / 2;
    const t = r.type.toLowerCase();

    if (t.includes('living') || t.includes('lounge')) {
      const isCompact = r.width < 10 || r.depth < 8;
      const sofaW = isCompact ? clamp(r.width - 2.5, 4.5, 6.5) : clamp(r.width - 4, 6.5, 9);
      const sofaD = isCompact ? 1.8 : 2.5;
      items.push({
        id: `furn-${i}-sofa`,
        type: 'Sofa',
        label: 'Sofa',
        x: round(r.x + 1.2),
        y: round(r.y + r.depth - sofaD - 0.8),
        width: round(sofaW),
        depth: sofaD,
        rotation: 0,
      });
      if (!isCompact && r.depth >= 8.5 && r.width >= 11) {
        items.push({
          id: `furn-${i}-table`,
          type: 'Coffee Table',
          label: 'Coffee Table',
          x: round(cx - 1.8),
          y: round(cy - 0.9),
          width: 3.6,
          depth: 1.8,
          rotation: 0,
        });
      }
      items.push({
        id: `furn-${i}-tv`,
        type: 'TV Unit',
        label: 'TV Unit',
        x: round(r.x + 1.2),
        y: round(r.y + 0.5),
        width: clamp(r.width - 3, 3.5, 6),
        depth: 1.0,
        rotation: 0,
      });
    } else if (t.includes('master') || t.includes('bedroom')) {
      const isMaster = t.includes('master');
      const isCompact = r.width < 9 || r.depth < 8;
      const bedW = isCompact ? 4.0 : isMaster ? 5.5 : 4.5;
      const bedD = isCompact ? 5.2 : 6.5;
      items.push({
        id: `furn-${i}-bed`,
        type: isMaster ? 'Double Bed' : 'Single Bed',
        label: isMaster ? 'Double Bed' : 'Single Bed',
        x: round(cx - bedW / 2),
        y: round(r.y + 0.8),
        width: bedW,
        depth: bedD,
        rotation: 0,
      });
      if (r.width >= 10 && r.depth >= 10) {
        items.push({
          id: `furn-${i}-wardrobe`,
          type: 'Wardrobe',
          label: 'Wardrobe',
          x: round(r.x + r.width - 2.2),
          y: round(r.y + 0.8),
          width: 1.8,
          depth: clamp(r.depth * 0.35, 3.5, 5),
          rotation: 0,
        });
      }
    } else if (t.includes('dining')) {
      const isCompact = r.width < 8 || r.depth < 6;
      const tableW = isCompact ? 3.4 : clamp(r.width * 0.45, 5, 7);
      const tableD = isCompact ? 2.2 : 3.0;
      items.push({
        id: `furn-${i}-dining`,
        type: 'Dining Table',
        label: 'Dining Table',
        x: round(cx - tableW / 2),
        y: round(cy - tableD / 2),
        width: round(tableW),
        depth: tableD,
        rotation: 0,
      });
    } else if (t.includes('kitchen')) {
      const isCompact = r.width < 7 || r.depth < 6;
      const counterW = isCompact ? clamp(r.width - 1.6, 3.5, 6) : clamp(r.width - 2.4, 5, 9);
      items.push({
        id: `furn-${i}-counter`,
        type: 'Kitchen Counter',
        label: 'Counter',
        x: round(r.x + 0.8),
        y: round(r.y + 0.6),
        width: round(counterW),
        depth: 1.8,
        rotation: 0,
      });
      if (r.depth >= 6) {
        items.push({
          id: `furn-${i}-fridge`,
          type: 'Refrigerator',
          label: 'Fridge',
          x: round(r.x + 0.8),
          y: round(r.y + r.depth - 2.6),
          width: 2.0,
          depth: 2.0,
          rotation: 0,
        });
      }
    } else if (t.includes('study') || t.includes('office')) {
      items.push({
        id: `furn-${i}-desk`,
        type: 'Desk',
        label: 'Study Desk',
        x: round(cx - 2.0),
        y: round(r.y + 0.8),
        width: 4.0,
        depth: 1.8,
        rotation: 0,
      });
    }
  });

  return items;
}

function generateFixtures(rooms) {
  const fixtures = [];
  rooms.forEach((r, i) => {
    if (!/bath|toilet/i.test(r.type)) return;
    const isCompact = r.width < 5.5;

    const wcW = isCompact ? 1.4 : 1.6;
    const wcD = isCompact ? 1.8 : 2.2;
    const sinkW = isCompact ? 1.3 : 1.8;
    const sinkD = isCompact ? 1.0 : 1.4;

    fixtures.push({
      id: `fix-${i}-wc`,
      type: 'WC',
      label: 'WC',
      x: round(r.x + 0.6),
      y: round(r.y + 0.6),
      width: wcW,
      depth: wcD,
      rotation: 0,
    });
    fixtures.push({
      id: `fix-${i}-sink`,
      type: 'Wash Basin',
      label: 'Basin',
      x: round(r.x + r.width - sinkW - 0.6),
      y: round(r.y + 0.6),
      width: sinkW,
      depth: sinkD,
      rotation: 0,
    });
    if (r.depth >= 6.5) {
      const showerW = isCompact ? round(r.width - 1.2) : 2.6;
      fixtures.push({
        id: `fix-${i}-shower`,
        type: 'Shower',
        label: 'Shower',
        x: round(r.x + 0.6),
        y: round(r.y + r.depth - 2.8),
        width: showerW,
        depth: 2.2,
        rotation: 0,
      });
    }
  });

  return fixtures;
}

function generateStairs(rooms, building, stairCoords, floorIndex) {
  if (stairCoords) {
    return [
      {
        id: `stairs-${floorIndex}`,
        x: stairCoords.x,
        y: stairCoords.y,
        width: stairCoords.width,
        depth: stairCoords.depth,
        steps: 14,
        direction: 'up',
      },
    ];
  }

  // Standard vertical position in circulation zone
  const r = rooms.find((room) => /dining|living/i.test(room.type)) || rooms[0];
  const width = 8.0;
  const depth = 11.0;
  const x = round(r.x + r.width - width - 0.5);
  const y = round(r.y + 0.5);

  return [
    {
      id: `stairs-${floorIndex}`,
      x,
      y,
      width,
      depth,
      steps: 14,
      direction: 'up',
    },
  ];
}

function generateDimensions(rooms, building, plotW, plotD) {
  const u = 'ft';
  const dims = [
    { id: 'dim-plot-w', x1: 0, y1: round(plotD + 2.5), x2: plotW, y2: round(plotD + 2.5), value: `${fmt(plotW)}${u}`, type: 'plot-width' },
    { id: 'dim-plot-d', x1: round(plotW + 2.5), y1: 0, x2: round(plotW + 2.5), y2: plotD, value: `${fmt(plotD)}${u}`, type: 'plot-depth' },
    { id: 'dim-building-w', x1: building.x, y1: round(building.y - 1.5), x2: round(building.x + building.width), y2: round(building.y - 1.5), value: `${fmt(building.width)}${u}`, type: 'building-width' },
    { id: 'dim-building-d', x1: round(building.x - 1.5), y1: building.y, x2: round(building.x - 1.5), y2: round(building.y + building.depth), value: `${fmt(building.depth)}${u}`, type: 'building-depth' },
  ];

  rooms.forEach((r, i) => {
    dims.push({
      id: `dim-room-w-${i}`,
      x1: r.x,
      y1: round(r.y - 0.6),
      x2: round(r.x + r.width),
      y2: round(r.y - 0.6),
      value: `${fmt(r.width)}${u}`,
      type: 'room-width',
      roomId: r.id,
    });
    dims.push({
      id: `dim-room-d-${i}`,
      x1: round(r.x - 0.6),
      y1: r.y,
      x2: round(r.x - 0.6),
      y2: round(r.y + r.depth),
      value: `${fmt(r.depth)}${u}`,
      type: 'room-depth',
      roomId: r.id,
    });
  });

  return dims;
}

export function generateFloorPlan(project = {}) {
  const width = Math.max(10, Number(project.plot?.width) || 40);
  const depth = Math.max(10, Number(project.plot?.depth) || 60);
  const unit = project.plot?.unit || 'ft';
  const floorCount = Math.max(1, Number(project.floors) || 1);
  const requested = project.requirements?.rooms || [];

  const floors = Array.from({ length: floorCount }, (_, floorIndex) =>
    layoutFloorPlan(width, depth, requested, floorIndex, floorCount)
  );

  return {
    projectName: project.name || 'Architectural Floor Plan',
    summary: `${floorCount}-floor architectural residential plan, ${width}${unit} × ${depth}${unit} plot with zoned layout`,
    plot: { width, depth, unit },
    floors,
  };
}

export function modifyFloorPlan(currentPlan, instruction = '') {
  const plan = JSON.parse(JSON.stringify(currentPlan));
  const text = instruction.toLowerCase();

  plan.floors.forEach((floor) => {
    if (text.includes('island') && !floor.furniture.some((f) => f.type === 'Kitchen Island')) {
      const kitchen = floor.rooms.find((r) => /kitchen/i.test(r.type));
      if (kitchen) {
        floor.furniture.push({
          id: `furn-island-${Date.now()}`,
          type: 'Kitchen Island',
          label: 'Island',
          x: round(kitchen.x + kitchen.width / 2 - 2.5),
          y: round(kitchen.y + kitchen.depth / 2),
          width: 5,
          depth: 1.8,
          rotation: 0,
        });
      }
    }

    if ((text.includes('add') || text.includes('another') || text.includes('more')) && text.includes('bedroom')) {
      const source = floor.rooms.find((r) => /bedroom/i.test(r.type));
      if (source) {
        const newRoom = { id: `room-added-${Date.now()}`, label: 'New Bedroom', type: 'Bedroom' };
        const regenerated = generateFloorPlan({
          name: plan.projectName,
          plot: plan.plot,
          floors: plan.floors.length,
          requirements: {
            rooms: [
              ...floor.rooms.map((r) => ({ type: r.type, label: r.label })),
              { type: newRoom.type, label: newRoom.label },
            ],
          },
        });
        floor.rooms = regenerated.floors[floor.floor].rooms;
        floor.walls = regenerated.floors[floor.floor].walls;
        floor.doors = regenerated.floors[floor.floor].doors;
        floor.windows = regenerated.floors[floor.floor].windows;
        floor.furniture = regenerated.floors[floor.floor].furniture;
        floor.fixtures = regenerated.floors[floor.floor].fixtures;
        floor.stairs = regenerated.floors[floor.floor].stairs;
        floor.dimensions = regenerated.floors[floor.floor].dimensions;
      }
    }
  });

  plan.summary = `${plan.summary.replace(/ \(Modified\)$/, '')} (Modified)`;
  return plan;
}
