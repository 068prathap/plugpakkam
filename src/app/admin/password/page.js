import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { dictionary } from '@/lib/dictionary';
import ChangePasswordForm from '@/components/AuthForms/ChangePasswordForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Admin password',
  robots: { index: false },
};

export default async function AdminPasswordPage() {
  await requireAdmin();
  const t = dictionary.en;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.changeTitle}</h1>
        <ChangePasswordForm t={t} />
        <p className={styles.switch}>
          <Link href="/admin">Back to admin</Link>
        </p>
      </div>
    </main>
  );
}
