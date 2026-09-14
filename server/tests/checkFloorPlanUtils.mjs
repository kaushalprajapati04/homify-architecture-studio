import { generateFloorPlan } from '../../src/utils/floorPlanUtils.js';

const plan = generateFloorPlan({
  name: 'Test 40x60',
  plot: { width: 40, depth: 60, unit: 'ft' },
  floors: 1,
  requirements: {
    rooms: [
      { type: 'Living Room', label: 'Living Room' },
      { type: 'Dining Room', label: 'Dining Room' },
      { type: 'Kitchen', label: 'Kitchen' },
      { type: 'Master Bedroom', label: 'Master Bedroom' },
      { type: 'Bedroom', label: 'Bedroom' },
      { type: 'Bathroom', label: 'Bathroom' },
      { type: 'Store', label: 'Store' },
    ]
  }
});

console.log('Building:', plan.floors[0].building);
console.log('Rooms:');
plan.floors[0].rooms.forEach(r => {
  console.log(`- ${r.label} (${r.type}): pos=(${r.x}, ${r.y}), size=${r.width}x${r.depth}`);
});

const b = plan.floors[0].building;
const maxY = Math.max(...plan.floors[0].rooms.map(r => r.y + r.depth));
console.log(`Building y=${b.y}, depth=${b.depth}, bottom=${b.y + b.depth}. Rooms maxY=${maxY}. Empty at bottom=${b.y + b.depth - maxY}`);
