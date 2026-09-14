const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  plot_width: { type: Number, required: true },
  plot_depth: { type: Number, required: true },
  plot_unit: { type: String, enum: ['ft', 'm'], default: 'ft' },
  floors: { type: Number, min: 1, default: 1 },
  rooms: { type: [mongoose.Schema.Types.Mixed], default: [] },
  requirements: { type: String, default: '' },
  floor_plan: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
