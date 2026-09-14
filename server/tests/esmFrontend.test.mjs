import assert from 'assert';
import { generateFloorPlan } from '../../src/utils/floorPlanUtils.js';
import { validateFloorPlan, formatArchitecturalDimension } from '../../src/utils/geometryUtils.js';

console.log('Testing ES Module src/utils/floorPlanUtils.js and geometryUtils.js...\n');

const testCases = [
  { w: 30, d: 40, f: 1, label: '30x40 1-floor' },
  { w: 30, d: 40, f: 2, label: '30x40 2-floor' },
  { w: 40, d: 60, f: 1, label: '40x60 1-floor' },
  { w: 40, d: 60, f: 2, label: '40x60 2-floor' },
  { w: 50, d: 80, f: 1, label: '50x80 1-floor' },
  { w: 50, d: 80, f: 2, label: '50x80 2-floor' },
  {
    w: 40,
    d: 60,
    f: 1,
    label: '40x60 1-floor 7-room (Living, Dining, Kitchen, Master Bed, Bedroom, Bath, Store)',
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

for (const tc of testCases) {
  const requested = tc.customRooms || [
    { type: 'Living Room', label: 'Living Room' },
    { type: 'Kitchen', label: 'Kitchen' },
    { type: 'Dining Room', label: 'Dining Area' },
    { type: 'Master Bedroom', label: 'Master Bedroom' },
    { type: 'Bedroom', label: 'Bedroom 2' },
    { type: 'Bathroom', label: 'Attached Bath' },
  ];

  const plan = generateFloorPlan({
    name: tc.label,
    plot: { width: tc.w, depth: tc.d, unit: 'ft' },
    floors: tc.f,
    requirements: { rooms: requested },
  });

  assert.strictEqual(plan.plot.width, tc.w);
  assert.strictEqual(plan.plot.depth, tc.d);
  assert.strictEqual(plan.floors.length, tc.f);

  const issues = validateFloorPlan(plan, requested);
  assert.strictEqual(issues.length, 0, `Issues for ${tc.label}: ${issues.join(', ')}`);

  console.log(`[PASS] ESM ${tc.label} verified with 0 issues.`);
}

console.log('\nTesting Phase 3 Architectural CAD Formatting & Notation...');

// Phase 3 Dimension Notation tests
assert.strictEqual(formatArchitecturalDimension(40, 'ft'), "40'-0\"", 'Must format 40ft as 40\'-0"');
assert.strictEqual(formatArchitecturalDimension(16, 'ft'), "16'-0\"", 'Must format 16ft as 16\'-0"');
assert.strictEqual(formatArchitecturalDimension(10.5, 'ft'), "10'-6\"", 'Must format 10.5ft as 10\'-6"');
assert.strictEqual(formatArchitecturalDimension(10.25, 'ft'), "10'-3\"", 'Must format 10.25ft as 10\'-3"');
assert.strictEqual(formatArchitecturalDimension(10.0833, 'ft'), "10'-1\"", 'Must format 10.0833ft as 10\'-1"');
assert.strictEqual(formatArchitecturalDimension(10.95, 'ft'), "10'-11\"", 'Must format 10.95ft as 10\'-11"');
assert.strictEqual(formatArchitecturalDimension(11.99, 'ft'), "12'-0\"", 'Must format 11.99ft as 12\'-0"');
assert.strictEqual(formatArchitecturalDimension(12.5, 'm'), "12.50m", 'Must format 12.5m as 12.50m');
assert.strictEqual(formatArchitecturalDimension(8, 'm'), "8.00m", 'Must format 8m as 8.00m');
console.log('[PASS] formatArchitecturalDimension formats all CAD feet-inches and meters accurately.');

// Phase 3 Entities Verification for CAD Renderers
const cadPlan = generateFloorPlan({
  name: 'CAD Quality Plan',
  plot: { width: 40, depth: 60, unit: 'ft' },
  floors: 2,
  requirements: {
    rooms: [
      { type: 'Living Room', label: 'Living Room' },
      { type: 'Dining Room', label: 'Dining Area' },
      { type: 'Kitchen', label: 'Kitchen' },
      { type: 'Master Bedroom', label: 'Master Bedroom' },
      { type: 'Bedroom', label: 'Bedroom 2' },
      { type: 'Bathroom', label: 'Bathroom' },
      { type: 'Store', label: 'Store' },
    ],
  },
});

assert.strictEqual(cadPlan.floors.length, 2);
cadPlan.floors.forEach((f, fi) => {
  assert(f.walls.length >= 8, `Floor ${fi} must have exterior and interior walls`);
  assert(f.doors.length >= 4, `Floor ${fi} must have doors`);
  assert(f.windows.length >= 3, `Floor ${fi} must have windows on exterior walls`);
  assert(f.stairs.length > 0, `Floor ${fi} must have stairs`);
  assert(f.furniture.length >= 4, `Floor ${fi} must have sensible furniture blocks`);
  assert(f.fixtures.length >= 2, `Floor ${fi} must have bathroom fixtures`);
  assert(f.dimensions.length >= 6, `Floor ${fi} must have architectural dimensions`);
});
console.log('[PASS] Phase 3 CAD architectural entity structures fully verified.');

console.log('\nAll ESM and Phase 3 CAD tests passed successfully!');

