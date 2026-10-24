import Link from 'next/link';
import Image from 'next/image';
import { requireUser } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import { getHostListings } from '@/lib/listings';
import { deleteListing, toggleAvailable } from '@/app/actions/listings';
import DeleteButton from '@/components/DeleteButton/DeleteButton';
import styles from './page.module.css';

export const metadata = {
  title: 'My places',
  robots: { index: false },
};

export default async function HostPage({ searchParams }) {
  const user = await requireUser('/host');
  const [{ saved }, t, listings] = await Promise.all([searchParams, getDict(), getHostListings(user.id)]);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1>{t.host.title}</h1>
          <p className={styles.subtitle}>{t.host.subtitle}</p>
        </div>
        <div className={styles.topActions}>
          <Link href="/account/password" className={styles.secondaryLink}>
            {t.host.changePassword}
          </Link>
          <Link href="/host/new" className={styles.add}>
            + {t.host.add}
          </Link>
        </div>
      </div>

      {saved && <p className={styles.saved}>{t.host.saved}</p>}

      {listings.length === 0 ? (
        <div className={styles.empty}>
          <h2>{t.host.emptyTitle}</h2>
          <p>{t.host.emptyText}</p>
          <Link href="/host/new" className={styles.add}>
            + {t.host.add}
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {listings.map((listing) => (
            <li key={listing.id} className={styles.card}>
              <div className={styles.thumb}>
                {listing.photos[0] && <Image src={listing.photos[0]} alt="" fill sizes="88px" />}
              </div>
              <div className={styles.info}>
                <h3>{listing.name}</h3>
                <p>
                  {listing.town} · ₹{listing.pricePerHour} {t.listing.perHour}
                </p>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${styles[listing.status]}`}>{t.status[listing.status]}</span>
                  {listing.status === 'approved' && (
                    <span className={`${styles.badge} ${listing.isAvailable ? styles.on : styles.off}`}>
                      {listing.isAvailable ? t.host.sharingToday : t.host.pausedToday}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                <Link href={`/listing/${listing.id}`}>{t.host.view}</Link>
                <Link href={`/host/${listing.id}/edit`}>{t.host.edit}</Link>
                <form action={toggleAvailable}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button type="submit">{listing.isAvailable ? t.host.pause : t.host.resume}</button>
                </form>
                <form action={deleteListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <DeleteButton label={t.host.delete} confirmText={t.host.deleteConfirm} className={styles.delete} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
