import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, safeNext } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import SignupForm from '@/components/AuthForms/SignupForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Create account',
  robots: { index: false },
};

export default async function SignupPage({ searchParams }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next));

  const t = await getDict();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.signupTitle}</h1>
        <p className={styles.subtitle}>{t.auth.signupSubtitle}</p>
        <SignupForm t={t} next={next} />
        <p className={styles.switch}>
          {t.auth.haveAccount} <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>{t.auth.signIn}</Link>
        </p>
      </div>
    </main>
  );
}
