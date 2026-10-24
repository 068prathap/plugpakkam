import Link from 'next/link';
import Image from 'next/image';
import { distanceText, isOpenNow, priceText } from '@/lib/format';
import styles from './ListingCard.module.css';

function ListingCard({ listing, t, selected, onHover }) {
  const open = isOpenNow(listing.timings);
  const isStation = listing.kind === 'station';
  const plugs = listing.plugs.slice(0, 2);
  const morePlugs = listing.plugs.length - plugs.length;

  return (
    <article
      className={`${styles.card} ${selected ? styles.selected : ''} ${listing.isAvailable ? '' : styles.paused}`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className={`${styles.thumb} ${isStation ? styles.stationThumb : ''}`}>
        {listing.photos[0] ? (
          <Image src={listing.photos[0]} alt="" fill sizes="64px" />
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6l.5-7.5Z" fill="currentColor" />
          </svg>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.top}>
          <Link href={`/listing/${listing.id}`} className={styles.name}>
            {listing.name}
          </Link>
          {listing.distance != null && <span className={styles.distance}>{distanceText(listing.distance)}</span>}
        </div>

        <p className={styles.meta}>
          <span className={isStation ? styles.kindStation : styles.kindShared}>{isStation ? t.listing.station : t.listing.shared}</span>
          {isStation && listing.operator && listing.operator !== listing.name && <span>{listing.operator}</span>}
          {!isStation && listing.town && <span>{listing.town}</span>}
        </p>

        <div className={styles.tags}>
          {priceText(listing, t) && <span className={styles.price}>{priceText(listing, t)}</span>}
          {!listing.isAvailable && <span className={styles.bad}>{t.listing.notAvailable}</span>}
          {listing.isAvailable && open === true && <span className={styles.good}>{t.listing.openNow}</span>}
          {listing.isAvailable && open === false && <span className={styles.bad}>{t.listing.closedNow}</span>}
          {plugs.map((plug) => (
            <span key={plug}>{plug === 'socket6a' || plug === 'socket16a' ? t.plugFilters.socket : t.plugFilters[plug]}</span>
          ))}
          {morePlugs > 0 && <span>+{morePlugs}</span>}
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
