import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    // Stored as YYYY-MM-DD so a "day" never shifts with time zones.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    task: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['done', 'in-progress', 'blocked'], default: 'done' },
    blocker: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model('WorkLog', workLogSchema);
