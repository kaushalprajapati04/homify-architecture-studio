const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { callGemini } = require('../services/gemini');

function normalizePlanToPlot(plan, targetPlot) {
  if (!plan || !plan.floors) return plan;

  const targetWidth = Math.max(10, Number(targetPlot.width) || 40);
  const targetDepth = Math.max(10, Number(targetPlot.depth) || 60);
  const targetUnit = targetPlot.unit === 'm' ? 'm' : 'ft';

  const normalizedFloors = plan.floors.map((floor) => {
    const rooms = floor.rooms || [];
    const walls = floor.walls || [];
    const building = floor.building || {};

    // 1. Determine bounding box of existing architecture
    let minX = building.x !== undefined ? Number(building.x) : Infinity;
    let minY = building.y !== undefined ? Number(building.y) : Infinity;
    let maxX = building.x !== undefined && building.width !== undefined ? Number(building.x) + Number(building.width) : -Infinity;
    let maxY = building.y !== undefined && building.depth !== undefined ? Number(building.y) + Number(building.depth) : -Infinity;

    rooms.forEach((r) => {
      minX = Math.min(minX, Number(r.x) || 0);
      minY = Math.min(minY, Number(r.y) || 0);
      maxX = Math.max(maxX, (Number(r.x) || 0) + (Number(r.width) || 0));
      maxY = Math.max(maxY, (Number(r.y) || 0) + (Number(r.depth) || 0));
    });

    // Fallback if no rooms or building coords found
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      minX = 2;
      minY = 2;
      maxX = targetWidth - 2;
      maxY = targetDepth - 2;
    }

    const contentWidth = Math.max(1, maxX - minX);
    const contentDepth = Math.max(1, maxY - minY);

    // 2. Check if content fits within the target plot without scaling
    // We only scale down if the building footprint exceeds the target plot boundaries.
    const maxAvailableWidth = targetWidth - 2; // preserve minimum 1ft setback on each side
    const maxAvailableDepth = targetDepth - 2;

    const needsScale = contentWidth > maxAvailableWidth || contentDepth > maxAvailableDepth;
    // When scaling is needed, use isotropic (uniform) scale to NEVER distort aspect ratios
    const scale = needsScale
      ? Math.min(maxAvailableWidth / contentWidth, maxAvailableDepth / contentDepth)
      : 1;

    // Center or position building inside target plot with proper setbacks
    const scaledWidth = contentWidth * scale;
    const scaledDepth = contentDepth * scale;

    let offsetX = minX;
    let offsetY = minY;

    if (needsScale || minX < 0 || minY < 0 || maxX > targetWidth || maxY > targetDepth) {
      offsetX = Math.max(1, (targetWidth - scaledWidth) / 2);
      offsetY = Math.max(1, (targetDepth - scaledDepth) / 2);
    }

    const transformX = (x) => Math.round(((Number(x) - minX) * scale + offsetX) * 100) / 100;
    const transformY = (y) => Math.round(((Number(y) - minY) * scale + offsetY) * 100) / 100;

    // 3. Transform rooms
    const newRooms = rooms.map((room) => ({
      ...room,
      x: transformX(room.x),
      y: transformY(room.y),
      width: Math.round((Number(room.width) * scale) * 100) / 100,
      depth: Math.round((Number(room.depth) * scale) * 100) / 100,
    }));

    // 4. Transform building envelope
    let bX = floor.building ? transformX(floor.building.x ?? minX) : Math.round(offsetX * 100) / 100;
    let bY = floor.building ? transformY(floor.building.y ?? minY) : Math.round(offsetY * 100) / 100;
    let bW = floor.building ? Math.round((Number(floor.building.width) * scale) * 100) / 100 : Math.round(scaledWidth * 100) / 100;
    let bD = floor.building ? Math.round((Number(floor.building.depth) * scale) * 100) / 100 : Math.round(scaledDepth * 100) / 100;

    if (newRooms.length > 0) {
      const roomsMaxY = Math.max(...newRooms.map((r) => r.y + r.depth));
      if (bY + bD - roomsMaxY > 3.5 && roomsMaxY > bY) {
        bD = Math.round((roomsMaxY - bY) * 100) / 100;
      }
    }

    const newBuilding = {
      ...(floor.building || {}),
      x: bX,
      y: bY,
      width: bW,
      depth: bD,
    };


    // 5. Transform walls (thickness MUST NOT be scaled)
    const newWalls = walls.map((wall) => ({
      ...wall,
      x1: transformX(wall.x1),
      y1: transformY(wall.y1),
      x2: transformX(wall.x2),
      y2: transformY(wall.y2),
      thickness: Number(wall.thickness) || (wall.type === 'exterior' ? 0.8 : 0.5),
    }));

    // 6. Transform doors (door width and height MUST NOT be scaled)
    const newDoors = (floor.doors || []).map((door) => ({
      ...door,
      x: transformX(door.x),
      y: transformY(door.y),
      width: Number(door.width) || 3,
      height: Number(door.height) || 0.15,
    }));

    // 7. Transform windows (window width and height MUST NOT be scaled)
    const newWindows = (floor.windows || []).map((win) => ({
      ...win,
      x: transformX(win.x),
      y: transformY(win.y),
      width: Number(win.width) || 4,
      height: Number(win.height) || 0.15,
    }));

    // 8. Transform furniture (furniture width and depth MUST NOT be scaled)
    const newFurniture = (floor.furniture || []).map((item) => ({
      ...item,
      x: transformX(item.x),
      y: transformY(item.y),
      width: Number(item.width) || 2,
      depth: Number(item.depth) || 2,
    }));

    // 9. Transform fixtures (fixture dimensions MUST NOT be scaled)
    const newFixtures = (floor.fixtures || []).map((item) => ({
      ...item,
      x: transformX(item.x),
      y: transformY(item.y),
      width: Number(item.width) || 1.5,
      depth: Number(item.depth) || 1.5,
    }));

    // 10. Transform stairs (stair width and depth MUST NOT be scaled)
    const newStairs = (floor.stairs || []).map((stair) => ({
      ...stair,
      x: transformX(stair.x),
      y: transformY(stair.y),
      width: Number(stair.width) || 5,
      depth: Number(stair.depth) || 8,
    }));

    // 11. Recalculate / anchor dimensions accurately to target plot
    const newDimensions = (floor.dimensions || []).map((dim) => {
      if (dim.type === 'plot-width') {
        return {
          ...dim,
          x1: 0,
          y1: targetDepth + 3,
          x2: targetWidth,
          y2: targetDepth + 3,
          value: `${targetWidth}${targetUnit}`,
        };
      }
      if (dim.type === 'plot-depth') {
        return {
          ...dim,
          x1: targetWidth + 3,
          y1: 0,
          x2: targetWidth + 3,
          y2: targetDepth,
          value: `${targetDepth}${targetUnit}`,
        };
      }
      return {
        ...dim,
        x1: transformX(dim.x1),
        y1: transformY(dim.y1),
        x2: transformX(dim.x2),
        y2: transformY(dim.y2),
      };
    });

    return {
      ...floor,
      building: newBuilding,
      rooms: newRooms,
      walls: newWalls,
      doors: newDoors,
      windows: newWindows,
      furniture: newFurniture,
      fixtures: newFixtures,
      stairs: newStairs,
      dimensions: newDimensions,
    };
  });

  return {
    ...plan,
    plot: {
      width: targetWidth,
      depth: targetDepth,
      unit: targetUnit,
    },
    floors: normalizedFloors,
  };
}


const { validateFloorPlan } = require('../services/validation');
const { generateFloorPlan: generateArchitecturalPlan, modifyFloorPlan } = require('../services/layoutEngine');

const router = express.Router();
router.use(auth);

router.post('/generate-floor-plan', async (req, res) => {
  try {
    const { name, plot, floors, requirements } = req.body || {};
    const targetW = Number(plot?.width) || 40;
    const targetD = Number(plot?.depth) || 60;
    const targetUnit = plot?.unit === 'm' ? 'm' : 'ft';
    const floorCount = Math.max(1, Number(floors) || 1);
    const requestedRooms = requirements?.rooms || [];

    const prompt = `You are designing a realistic residential architectural floor plan for "${name || 'Modern Residence'}".

SITE SPECIFICATIONS:
- Complete Plot: ${targetW} × ${targetD} ${targetUnit} (boundary from (0,0) to (${targetW}, ${targetD}))
- Floors: ${floorCount}
- Requested rooms: ${JSON.stringify(requestedRooms)}
- Additional instructions: ${requirements?.description || 'none'}

ARCHITECTURAL PLANNING INSTRUCTIONS:
1. SITE ZONING & FOOTPRINT:
   - Position building inside plot using realistic setbacks (front: 8-14 ft for parking/porch; rear: 4-6 ft; sides: 2.5-4 ft).
   - Building footprint must occupy practical residential area (~55% to 75% of site).
   - Rooms MUST span the entire depth of the building footprint from front to rear. NEVER cluster rooms at the top leaving the lower building empty!
2. FUNCTIONAL ZONING:
   - Front/public: Entrance porch/veranda, formal living room, foyer.
   - Central/semi-public: Dining room, central circulation corridor, staircase (for multi-floor).
   - Service wing: Kitchen (must touch exterior wall for window ventilation), utility/store.
   - Private wing: Master bedroom with attached bath, secondary bedrooms, common bath.
3. PROPORTIONS (FEET):
   - Living: 14-20 × 14-20 ft (spacious primary hub)
   - Master Bed: 12-16 × 13-16 ft
   - Bedroom: 10-13 × 11-14 ft
   - Kitchen: 8-12 × 10-14 ft
   - Dining: 10-14 × 10-14 ft
   - Bathroom: 5-8 × 7-9 ft (compact, functional, NEVER equal to living room!)
   - Staircase: 7.5-9 × 10-14 ft
   - Porch: 8-14 × 6-10 ft
   - NEVER use equal-sized grid cells!
4. CIRCULATION:
   - Clear movement flow connecting zones. No landlocked rooms.
   - Multi-floor: Staircase landing at identical (x, y) coordinates on both floors.
5. STEP-BY-STEP REASONING:
   - First populate the "reasoning" object (siteZoning, buildingFootprint, setbacks, roomHierarchy, circulation, proportions).
   - Then generate the floors, rooms, walls, doors, windows, and furniture.`;

    let plan = null;
    try {
      plan = await callGemini(prompt);
    } catch (apiErr) {
      console.warn('Gemini API call failed, falling back to local architectural layout engine:', apiErr.message);
    }

    if (!plan || !plan.floors || plan.floors.length === 0) {
      console.log('Generating fallback architectural floor plan...');
      const fallbackPlan = generateArchitecturalPlan({
        name: name || 'Architectural Residence',
        plot: { width: targetW, depth: targetD, unit: targetUnit },
        floors: floorCount,
        requirements: { rooms: requestedRooms, description: requirements?.description || '' },
      });
      return res.json(fallbackPlan);
    }

    const normalizedPlan = normalizePlanToPlot(plan, {
      width: targetW,
      depth: targetD,
      unit: targetUnit,
    });

    const issues = validateFloorPlan(normalizedPlan, requestedRooms);
    if (issues.length > 0) {
      console.warn('AI-generated plan had validation issues:', issues);
      const hasSevereIssue = issues.some((iss) =>
        /overlap|negative|outside the plot|non-positive|excessive unused area|low building space utilization|omitted from the plan/i.test(iss)
      );
      if (hasSevereIssue) {
        console.warn('Falling back to local architectural engine due to severe AI plan validation issues');
        const fallbackPlan = generateArchitecturalPlan({
          name: name || 'Architectural Residence',
          plot: { width: targetW, depth: targetD, unit: targetUnit },
          floors: floorCount,
          requirements: { rooms: requestedRooms, description: requirements?.description || '' },
        });
        return res.json(fallbackPlan);
      }
    }


    res.json(normalizedPlan);
  } catch (err) {
    console.error('Error in /generate-floor-plan:', err);
    try {
      const fallbackPlan = generateArchitecturalPlan({
        name: req.body?.name || 'Architectural Residence',
        plot: {
          width: Number(req.body?.plot?.width) || 40,
          depth: Number(req.body?.plot?.depth) || 60,
          unit: req.body?.plot?.unit || 'ft',
        },
        floors: Math.max(1, Number(req.body?.floors) || 1),
        requirements: { rooms: req.body?.requirements?.rooms || [] },
      });
      return res.json(fallbackPlan);
    } catch (fallbackErr) {
      res.status(502).json({ error: err.message || 'AI generation failed' });
    }
  }
});

router.post('/modify-floor-plan', async (req, res) => {
  const { currentPlan, instruction } = req.body || {};
  if (!currentPlan || !instruction) {
    return res.status(400).json({ error: 'Current plan and instruction are required' });
  }

  try {
    const plan = await callGemini(
      `Modify this existing floor plan according to this instruction: ${instruction}. Preserve all unrelated geometry and return the complete corrected plan. Current plan: ${JSON.stringify(currentPlan)}`
    );
    if (plan && plan.floors && plan.floors.length > 0) {
      return res.json(plan);
    }
  } catch (err) {
    console.warn('Gemini modification failed, falling back to local modifier:', err.message);
  }

  try {
    const fallbackPlan = modifyFloorPlan(currentPlan, instruction);
    return res.json(fallbackPlan);
  } catch (fallbackErr) {
    return res.json(currentPlan);
  }
});

module.exports = router;
