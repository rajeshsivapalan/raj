import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    client: { type: String, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['active', 'on-hold', 'completed'], default: 'active' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
