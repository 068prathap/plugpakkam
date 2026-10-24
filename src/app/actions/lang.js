'use server';

import { cookies } from 'next/headers';

export async function setLang(lang) {
  const cookieStore = await cookies();
  cookieStore.set('lang', lang === 'ta' ? 'ta' : 'en', {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });
}
