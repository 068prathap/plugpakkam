import Link from 'next/link';
import { dictionary } from '@/lib/dictionary';
import ForgotForm from '@/components/AuthForms/ForgotForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Admin reset password',
  robots: { index: false },
};

export default function AdminForgotPage() {
  const t = dictionary.en;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.forgotTitle}</h1>
        <p className={styles.subtitle}>{t.auth.forgotSubtitle}</p>
        <ForgotForm t={t} admin />
        <p className={styles.switch}>
          <Link href="/admin/login">{t.auth.signIn}</Link>
        </p>
      </div>
    </main>
  );
}
