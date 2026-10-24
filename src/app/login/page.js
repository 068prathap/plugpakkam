import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, safeNext } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import LoginForm from '@/components/AuthForms/LoginForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next));

  const t = await getDict();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.loginTitle}</h1>
        <p className={styles.subtitle}>{t.auth.loginSubtitle}</p>
        <LoginForm t={t} next={next} />
        <p className={styles.switch}>
          {t.auth.noAccount} <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}>{t.auth.createAccount}</Link>
        </p>
      </div>
    </main>
  );
}
