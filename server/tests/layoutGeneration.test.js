const assert = require('assert');
const { generateFloorPlan, calculateSetbacks } = require('../services/layoutEngine');
const { validateFloorPlan, rectsOverlap, pointInRect } = require('../services/validation');

function runTests() {
  console.log('================================================================');
  console.log('Running Homify Architectural Layout Generation Tests (Phase 2)');
  console.log('================================================================\n');

  const testConfigs = [
    { width: 30, depth: 40, floors: 1, name: 'Compact 30×40 ft (1-Floor)' },
    { width: 30, depth: 40, floors: 2, name: 'Compact 30×40 ft (2-Floor)' },
    { width: 40, depth: 60, floors: 1, name: 'Standard 40×60 ft (1-Floor)' },
    { width: 40, depth: 60, floors: 2, name: 'Standard 40×60 ft (2-Floor)' },
    { width: 50, depth: 80, floors: 1, name: 'Large 50×80 ft (1-Floor)' },
    { width: 50, depth: 80, floors: 2, name: 'Large 50×80 ft (2-Floor)' },
    {
      width: 40,
      depth: 60,
      floors: 1,
      name: 'Exact Case: 40×60 ft 1-Floor (7 Required Rooms with Store)',
      customRooms: [
        { type: 'Living Room', label: 'Living Room' },
        { type: 'Dining Room', label: 'Dining Room' },
        { type: 'Kitchen', label: 'Kitchen' },
        { type: 'Master Bedroom', label: 'Master Bedroom' },
        { type: 'Bedroom', label: 'Bedroom' },
        { type: 'Bathroom', label: 'Bathroom' },
        { type: 'Store', label: 'Store' },
      ],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const config of testConfigs) {
    try {
      console.log(`Testing: ${config.name}`);

      const requestedRooms = config.customRooms || [
        { type: 'Living Room', label: 'Living Room' },
        { type: 'Kitchen', label: 'Kitchen' },
        { type: 'Dining Room', label: 'Dining Area' },
        { type: 'Master Bedroom', label: 'Master Bedroom' },
        { type: 'Bedroom', label: 'Bedroom 2' },
        { type: 'Bathroom', label: 'Attached Bath' },
      ];


      const plan = generateFloorPlan({
        name: config.name,
        plot: { width: config.width, depth: config.depth, unit: 'ft' },
        floors: config.floors,
        requirements: { rooms: requestedRooms },
      });

      // 1. Verify exact plot dimensions
      assert.strictEqual(plan.plot.width, config.width, `Plot width must match exact input ${config.width}`);
      assert.strictEqual(plan.plot.depth, config.depth, `Plot depth must match exact input ${config.depth}`);
      assert.strictEqual(plan.floors.length, config.floors, `Floor count must match exact input ${config.floors}`);

      // 2. Run comprehensive geometric validation
      const issues = validateFloorPlan(plan, requestedRooms);
      assert.strictEqual(issues.length, 0, `Validation issues found: ${issues.join('; ')}`);

      // 3. Verify each floor's architectural properties
      plan.floors.forEach((floor, fi) => {
        const building = floor.building;
        assert(building, `Floor ${fi} must define building footprint`);
        assert(building.width > 0 && building.depth > 0, `Building must have positive dimensions`);

        // Verify setbacks
        const frontSetback = building.y;
        const rearSetback = config.depth - (building.y + building.depth);
        const leftSetback = building.x;
        const rightSetback = config.width - (building.x + building.width);
        assert(frontSetback >= 3, `Front setback (${frontSetback}) must be >= 3 ft`);
        assert(rearSetback >= 2, `Rear setback (${rearSetback}) must be >= 2 ft`);
        assert(leftSetback >= 1.5, `Left setback (${leftSetback}) must be >= 1.5 ft`);
        assert(rightSetback >= 1.5, `Right setback (${rightSetback}) must be >= 1.5 ft`);

        // Building area ratio (should be realistic 50% - 75%)
        const plotArea = config.width * config.depth;
        const buildingArea = building.width * building.depth;
        const coverageRatio = buildingArea / plotArea;
        assert(coverageRatio >= 0.50 && coverageRatio <= 0.80, `Building coverage (${(coverageRatio * 100).toFixed(1)}%) must be practical`);

        // 4. Verify no rooms overlap
        const rooms = floor.rooms;
        assert(rooms.length >= 3, `Floor ${fi} must have at least 3 rooms`);
        for (let i = 0; i < rooms.length; i++) {
          for (let j = i + 1; j < rooms.length; j++) {
            const overlap = rectsOverlap(rooms[i], rooms[j], 0.1);
            assert(!overlap, `Rooms ${rooms[i].label} and ${rooms[j].label} must not overlap!`);
          }
        }

        // 5. Verify room proportions (NO equal-grid rooms!)
        const roomAreas = rooms.map(r => r.width * r.depth);
        const minArea = Math.min(...roomAreas);
        const maxArea = Math.max(...roomAreas);
        assert(maxArea > minArea * 1.5, `Rooms must NOT be equal-sized grid cells! Max: ${maxArea}, Min: ${minArea}`);

        const living = rooms.find(r => /living|lounge/i.test(r.type));
        const bath = rooms.find(r => /bath/i.test(r.type));
        if (living && bath) {
          const livingArea = living.width * living.depth;
          const bathArea = bath.width * bath.depth;
          assert(livingArea >= bathArea * 2.0, `Living Room (${livingArea} sqft) must be significantly larger than Bathroom (${bathArea} sqft)`);
          assert(bath.width <= 10 && bath.depth <= 10, `Bathroom (${bath.width}×${bath.depth}) must not be an oversized room`);
        }

        // 6. Verify furniture is contained inside rooms
        (floor.furniture || []).forEach(f => {
          assert(f.width > 0 && f.depth > 0, `Furniture ${f.label} must have positive dimensions`);
          const cx = f.x + f.width / 2;
          const cy = f.y + f.depth / 2;
          const insideRoom = rooms.some(r => pointInRect(cx, cy, r));
          assert(insideRoom, `Furniture ${f.label} must be inside a room`);
        });

        // 7. Verify fixtures inside bathrooms
        (floor.fixtures || []).forEach(fx => {
          assert(fx.width > 0 && fx.depth > 0, `Fixture ${fx.label} must have positive dimensions`);
          const cx = fx.x + fx.width / 2;
          const cy = fx.y + fx.depth / 2;
          const insideRoom = rooms.some(r => pointInRect(cx, cy, r));
          assert(insideRoom, `Fixture ${fx.label} must be inside a bathroom`);
        });
      });

      // 8. Multi-floor staircase vertical alignment
      if (config.floors > 1) {
        const f0Stairs = plan.floors[0].stairs;
        const f1Stairs = plan.floors[1].stairs;
        assert(f0Stairs.length > 0, 'Floor 0 must have stairs for multi-floor home');
        assert(f1Stairs.length > 0, 'Floor 1 must have stairs for multi-floor home');
        assert.strictEqual(f0Stairs[0].x, f1Stairs[0].x, 'Stairs x-coordinate must align between floors');
        assert.strictEqual(f0Stairs[0].y, f1Stairs[0].y, 'Stairs y-coordinate must align between floors');
        assert.strictEqual(f0Stairs[0].width, f1Stairs[0].width, 'Stairs width must align between floors');
        assert.strictEqual(f0Stairs[0].depth, f1Stairs[0].depth, 'Stairs depth must align between floors');
      }

      console.log(`  -> PASSED: All architectural & geometric rules verified.\n`);
      passed++;
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${testConfigs.length} test configurations`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
