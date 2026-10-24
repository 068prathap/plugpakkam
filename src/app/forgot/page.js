import Link from 'next/link';
import { getDict } from '@/lib/lang';
import ForgotForm from '@/components/AuthForms/ForgotForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Reset password',
  robots: { index: false },
};

export default async function ForgotPage() {
  const t = await getDict();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.forgotTitle}</h1>
        <p className={styles.subtitle}>{t.auth.forgotSubtitle}</p>
        <ForgotForm t={t} />
        <p className={styles.switch}>
          <Link href="/login">{t.auth.signIn}</Link>
        </p>
      </div>
    </main>
  );
}
