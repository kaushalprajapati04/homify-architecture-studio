const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

const router = express.Router();
router.use(auth);

function shape(project) {
  const p = project.toObject ? project.toObject() : project;
  return { ...p, id: p._id.toString() };
}

router.get('/', async (req, res) => {
  const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json(projects.map(shape));
});

router.post('/', async (req, res) => {
  try {
    const { name, plot, floors, requirements } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Project name is required' });
    const project = await Project.create({
      userId: req.userId,
      name: name.trim(),
      plot_width: Number(plot?.width) || 40,
      plot_depth: Number(plot?.depth) || 60,
      plot_unit: plot?.unit === 'm' ? 'm' : 'ft',
      floors: Math.max(1, Number(floors) || 1),
      rooms: requirements?.rooms || [],
      requirements: requirements?.description || '',
      floor_plan: {},
    });
    res.status(201).json(shape(project));
  } catch { res.status(500).json({ error: 'Failed to create project' }); }
});

router.get('/:id', async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(shape(project));
});

router.put('/:id', async (req, res) => {
  const allowed = {};
  ['name', 'plot_width', 'plot_depth', 'plot_unit', 'floors', 'rooms', 'requirements', 'floor_plan'].forEach(k => {
    if (req.body?.[k] !== undefined) allowed[k] = req.body[k];
  });
  const project = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, allowed, { new: true, runValidators: true });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(shape(project));
});

router.delete('/:id', async (req, res) => {
  const result = await Project.deleteOne({ _id: req.params.id, userId: req.userId });
  if (!result.deletedCount) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true });
});

module.exports = router;
