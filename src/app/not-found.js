import Link from 'next/link';
import { getDict } from '@/lib/lang';

export default async function NotFound() {
  const t = await getDict();

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 24 }}>{t.listing.notFound}</h1>
      <p style={{ marginTop: 16 }}>
        <Link href="/" style={{ color: 'var(--green)', fontWeight: 600 }}>
          {t.listing.back}
        </Link>
      </p>
    </main>
  );
}
