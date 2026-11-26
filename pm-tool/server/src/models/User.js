import mongoose from 'mongoose';

export const ROLES = ['employee', 'lead', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'employee' },
    designation: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { delete ret.passwordHash; return ret; } },
  }
);

export default mongoose.model('User', userSchema);
