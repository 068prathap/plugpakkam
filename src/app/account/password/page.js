import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import ChangePasswordForm from '@/components/AuthForms/ChangePasswordForm';
import styles from '@/styles/auth.module.css';

export const metadata = {
  title: 'Change password',
  robots: { index: false },
};

export default async function ChangePasswordPage() {
  await requireUser('/account/password');
  const t = await getDict();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>{t.auth.changeTitle}</h1>
        <ChangePasswordForm t={t} />
        <p className={styles.switch}>
          <Link href="/host">{t.host.title}</Link>
        </p>
      </div>
    </main>
  );
}
