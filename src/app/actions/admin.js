'use server';

import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Listing from '@/models/Listing';
import Report from '@/models/Report';

export async function setListingStatus(formData) {
  await requireAdmin();
  const listingId = formData.get('listingId');
  const status = formData.get('status');
  if (!mongoose.isValidObjectId(listingId) || !['approved', 'rejected'].includes(status)) return;

  await connectDB();
  await Listing.updateOne({ _id: listingId }, { status });
  revalidatePath('/admin');
  revalidatePath(`/listing/${listingId}`);
}

export async function resolveReport(formData) {
  await requireAdmin();
  const reportId = formData.get('reportId');
  if (!mongoose.isValidObjectId(reportId)) return;

  await connectDB();
  await Report.updateOne({ _id: reportId }, { status: 'resolved' });
  revalidatePath('/admin');
}
