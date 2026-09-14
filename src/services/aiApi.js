import { api } from './api';

export async function generateFloorPlan(projectData) {
  try {
    return await api.post('/generate-floor-plan', projectData);
  } catch (err) {
    console.warn('AI generateFloorPlan unavailable, using local generator:', err);
    return null;
  }
}

export async function modifyFloorPlan(currentPlan, instruction) {
  try {
    return await api.post('/modify-floor-plan', { currentPlan, instruction });
  } catch (err) {
    console.warn('AI modifyFloorPlan unavailable, using local modifier:', err);
    return null;
  }
}


