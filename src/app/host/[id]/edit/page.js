import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getDict, getLang } from '@/lib/lang';
import { getListing } from '@/lib/listings';
import ListingForm from '@/components/ListingForm/ListingForm';
import styles from '@/styles/form.module.css';

export const metadata = {
  title: 'Edit place',
  robots: { index: false },
};

export default async function EditListingPage({ params }) {
  const { id } = await params;
  const user = await requireUser(`/host/${id}/edit`);
  const [listing, t, lang] = await Promise.all([getListing(id), getDict(), getLang()]);
  if (!listing || listing.host !== user.id) notFound();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t.form.editTitle}</h1>
      <ListingForm listing={listing} t={t} lang={lang} />
    </main>
  );
}
