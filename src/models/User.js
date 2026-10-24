import mongoose from 'mongoose';
import { USER_ROLES } from '@/lib/constants';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'host' },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
