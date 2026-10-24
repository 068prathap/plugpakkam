import Link from 'next/link';
import { callLink, directionsLink, distanceText, isOpenNow, priceText } from '@/lib/format';
import styles from './PreviewCard.module.css';

function PreviewCard({ listing, t, onClose }) {
  const open = isOpenNow(listing.timings);
  const isStation = listing.kind === 'station';

  return (
    <div className={styles.card}>
      <button type="button" className={styles.close} onClick={onClose} aria-label={t.finder.close}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z" fill="currentColor" />
        </svg>
      </button>

      <p className={isStation ? styles.kindStation : styles.kindShared}>{isStation ? t.listing.station : t.listing.shared}</p>
      <h2>{listing.name}</h2>
      <p className={styles.meta}>
        {[distanceText(listing.distance), priceText(listing, t), open === true ? t.listing.openNow : open === false ? t.listing.closedNow : '']
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div className={styles.actions}>
        {listing.phone && (
          <a href={callLink(listing.phone)} className={styles.primary}>
            {t.listing.call}
          </a>
        )}
        <a href={directionsLink(listing.lat, listing.lng)} target="_blank" rel="noopener noreferrer" className={listing.phone ? styles.secondary : styles.primary}>
          {t.listing.directions}
        </a>
        <Link href={`/listing/${listing.id}`} className={styles.secondary}>
          {t.finder.view}
        </Link>
      </div>
    </div>
  );
}

export default PreviewCard;
