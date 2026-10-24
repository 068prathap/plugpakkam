import { requireUser } from '@/lib/auth';
import { getDict, getLang } from '@/lib/lang';
import ListingForm from '@/components/ListingForm/ListingForm';
import styles from '@/styles/form.module.css';

export const metadata = {
  title: 'Add your place',
  robots: { index: false },
};

export default async function NewListingPage() {
  await requireUser('/host/new');
  const [t, lang] = await Promise.all([getDict(), getLang()]);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t.form.newTitle}</h1>
      <ListingForm t={t} lang={lang} />
    </main>
  );
}
