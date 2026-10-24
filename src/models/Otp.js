import mongoose from 'mongoose';
import { OTP_PURPOSES } from '@/lib/constants';

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ phone: 1, purpose: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);
