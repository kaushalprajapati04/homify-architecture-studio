import { api } from './api';

function normalizeProject(p) {
  if (!p) return p;
  return {
    ...p,
    id: p.id || p._id,
    updated_at: p.updated_at || p.updatedAt,
    created_at: p.created_at || p.createdAt,
  };
}

export async function fetchProjects() {
  const data = await api.get('/projects');
  return (data || []).map(normalizeProject);
}

export async function fetchProject(id) {
  if (!id) return null;
  return normalizeProject(await api.get(`/projects/${encodeURIComponent(id)}`));
}

export async function createProject(projectData) {
  return normalizeProject(await api.post('/projects', projectData));
}

export async function updateProject(id, updates) {
  return normalizeProject(await api.put(`/projects/${encodeURIComponent(id)}`, updates));
}

export async function deleteProject(id) {
  await api.delete(`/projects/${encodeURIComponent(id)}`);
  return true;
}

export async function updateFloorPlan(id, floorPlan) {
  return normalizeProject(await api.put(`/projects/${encodeURIComponent(id)}`, { floor_plan: floorPlan }));
}

export async function renameProject(id, name) {
  return updateProject(id, { name });
}
