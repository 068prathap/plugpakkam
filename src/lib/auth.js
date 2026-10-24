import 'server-only';
import { cache } from 'react';
import mongoose from 'mongoose';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/session';
import User from '@/models/User';

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.id || !mongoose.isValidObjectId(session.id)) return null;

  await connectDB();
  const user = await User.findById(session.id, 'name phone role sessionVersion').lean();
  if (!user || user.sessionVersion !== session.v) return null;

  return { id: user._id.toString(), name: user.name, phone: user.phone, role: user.role };
});

export async function requireUser(next = '/host') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/admin/login');
  return user;
}

export function safeNext(next, fallback = '/host') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
