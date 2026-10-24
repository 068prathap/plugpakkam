import 'server-only';
import { cookies } from 'next/headers';
import { dictionary } from '@/lib/dictionary';

export async function getLang() {
  const cookieStore = await cookies();
  return cookieStore.get('lang')?.value === 'ta' ? 'ta' : 'en';
}

export async function getDict() {
  return dictionary[await getLang()];
}
