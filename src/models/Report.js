import mongoose from 'mongoose';
import { REPORT_REASONS, REPORT_STATUS } from '@/lib/constants';

const reportSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: REPORT_STATUS, default: 'open' },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
