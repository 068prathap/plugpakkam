import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { dictionary } from '@/lib/dictionary';
import LoginForm from '@/components/AuthForms/LoginForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Admin sign in',
  robots: { index: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === 'admin') redirect('/admin');

  const t = dictionary.en;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.adminTitle}</h1>
        <LoginForm t={t} admin />
      </div>
    </main>
  );
}
