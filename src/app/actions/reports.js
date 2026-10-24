'use server';

import mongoose from 'mongoose';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { notifyAdmin } from '@/lib/notify';
import { dictionary } from '@/lib/dictionary';
import { REPORT_REASONS } from '@/lib/constants';
import Listing from '@/models/Listing';
import Report from '@/models/Report';

export async function createReport(prevState, formData) {
  const listingId = formData.get('listingId');
  const reason = formData.get('reason');
  const note = formData.get('note')?.trim().slice(0, 300) || '';

  if (!mongoose.isValidObjectId(listingId) || !REPORT_REASONS.includes(reason)) {
    return { sent: false, error: true };
  }

  await connectDB();
  const listing = await Listing.findById(listingId, 'name town').lean();
  if (!listing) return { sent: false, error: true };

  await Report.create({ listing: listingId, reason, note });
  after(() =>
    notifyAdmin([
      'New report',
      `${listing.name}${listing.town ? `, ${listing.town}` : ''}`,
      dictionary.en.reasons[reason],
      note,
    ].filter(Boolean))
  );

  revalidatePath('/admin');
  return { sent: true };
}
