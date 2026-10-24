'use server';

import { createHash } from 'node:crypto';
import { requireUser } from '@/lib/auth';

export async function signUpload() {
  await requireUser();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const folder = 'plugpakkam';
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return { cloudName, apiKey, folder, timestamp, signature };
}
