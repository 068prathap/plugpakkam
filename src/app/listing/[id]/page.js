import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import { getListing } from '@/lib/listings';
import { callLink, directionsLink, hasSocket, isOpenNow, priceText, timingsText, whatsappLink } from '@/lib/format';
import ReportForm from '@/components/ReportForm/ReportForm';
import styles from './page.module.css';

async function getVisibleListing(id) {
  const listing = await getListing(id);
  if (!listing) return null;
  if (listing.status === 'approved') {
    const user = await getCurrentUser();
    return { listing, isOwner: !!user && user.id === listing.host };
  }

  const user = await getCurrentUser();
  const isOwner = !!user && user.id === listing.host;
  if (isOwner || user?.role === 'admin') return { listing, isOwner };
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing || listing.status !== 'approved') return { title: 'Not found', robots: { index: false } };

  const t = await getDict();
  const plugs = listing.plugs.map((plug) => t.plugs[plug]).join(', ');
  const place = [listing.name, listing.town].filter(Boolean).join(', ');
  return {
    title: place,
    description: `EV charging at ${place}. ${plugs}${listing.pricePerHour ? `. Rs ${listing.pricePerHour} per hour` : ''}.`,
    alternates: { canonical: `/listing/${listing.id}` },
    openGraph: listing.photos[0] ? { images: [listing.photos[0]] } : undefined,
  };
}

export default async function ListingPage({ params }) {
  const { id } = await params;
  const [found, t] = await Promise.all([getVisibleListing(id), getDict()]);
  if (!found) notFound();

  const { listing, isOwner } = found;
  const isStation = listing.kind === 'station';
  const open = isOpenNow(listing.timings);
  const price = priceText(listing, t);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: listing.name,
    address: [listing.address, listing.town].filter(Boolean).join(', ') || undefined,
    geo: { '@type': 'GeoCoordinates', latitude: listing.lat, longitude: listing.lng },
  };

  return (
    <main className={styles.page}>
      {listing.status === 'approved' && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      )}

      <Link href="/" className={styles.back}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M15.4 5 8.4 12l7 7-1.4 1.4L5.6 12l8.4-8.4L15.4 5Z" fill="currentColor" />
        </svg>
        {t.listing.back}
      </Link>

      {listing.status === 'pending' && <p className={styles.banner}>{t.listing.pendingBanner}</p>}
      {listing.status === 'rejected' && <p className={`${styles.banner} ${styles.rejected}`}>{t.listing.rejectedBanner}</p>}

      <div className={styles.card}>
        {listing.photos.length > 0 && (
          <div className={styles.photos}>
            {listing.photos.map((url, index) => (
              <div key={url} className={styles.photo}>
                <Image src={url} alt={`${listing.name} photo ${index + 1}`} fill sizes="(min-width: 768px) 360px, 85vw" priority={index === 0} />
              </div>
            ))}
          </div>
        )}

        <div className={styles.head}>
          <p className={isStation ? styles.kindStation : styles.kindShared}>
            {isStation ? t.listing.station : t.listing.shared}
            {!isStation && listing.placeType && ` · ${t.places[listing.placeType]}`}
          </p>
          <h1>{listing.name}</h1>
          {(listing.town || listing.operator) && <p className={styles.sub}>{[listing.operator !== listing.name && listing.operator, listing.town].filter(Boolean).join(' · ')}</p>}
          <div className={styles.tags}>
            {price && <span className={styles.price}>{price}</span>}
            {!listing.isAvailable && <span className={styles.bad}>{t.listing.notAvailable}</span>}
            {listing.isAvailable && open === true && <span className={styles.good}>{t.listing.openNow}</span>}
            {listing.isAvailable && open === false && <span className={styles.bad}>{t.listing.closedNow}</span>}
          </div>
        </div>

        <div className={styles.actions}>
          {listing.phone && (
            <a href={callLink(listing.phone)} className={styles.primary}>
              {t.listing.call}
            </a>
          )}
          {listing.whatsapp && (
            <a href={whatsappLink(listing.whatsapp, t.listing.whatsappMessage)} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
              {t.listing.whatsapp}
            </a>
          )}
          <a href={directionsLink(listing.lat, listing.lng)} target="_blank" rel="noopener noreferrer" className={listing.phone ? styles.secondary : styles.primary}>
            {t.listing.directions}
          </a>
        </div>
      </div>

      <dl className={styles.details}>
        <div>
          <dt>{t.listing.plugs}</dt>
          <dd>
            {listing.plugs.length > 0 ? listing.plugs.map((plug) => t.plugs[plug]).join(', ') : t.listing.unknown}
            {hasSocket(listing.plugs) && <span className={styles.hint}>{t.listing.bringCharger}</span>}
          </dd>
        </div>
        {listing.vehicles.length > 0 && (
          <div>
            <dt>{t.listing.vehicles}</dt>
            <dd>{listing.vehicles.map((vehicle) => t.vehicles[vehicle]).join(', ')}</dd>
          </div>
        )}
        <div>
          <dt>{t.listing.timings}</dt>
          <dd>{timingsText(listing.timings, t)}</dd>
        </div>
        {price && (
          <div>
            <dt>{t.listing.price}</dt>
            <dd>{price}</dd>
          </div>
        )}
        {listing.payments.length > 0 && (
          <div>
            <dt>{t.listing.payment}</dt>
            <dd>{listing.payments.map((payment) => t.payments[payment]).join(', ')}</dd>
          </div>
        )}
        {listing.address && (
          <div>
            <dt>{t.listing.address}</dt>
            <dd>{listing.address}</dd>
          </div>
        )}
        {listing.landmark && (
          <div>
            <dt>{t.listing.landmark}</dt>
            <dd>{listing.landmark}</dd>
          </div>
        )}
        {listing.note && (
          <div>
            <dt>{t.listing.note}</dt>
            <dd>{listing.note}</dd>
          </div>
        )}
      </dl>

      {isStation && <p className={styles.source}>{t.listing.stationNote}</p>}

      {isOwner && (
        <Link href={`/host/${listing.id}/edit`} className={styles.edit}>
          {t.listing.edit}
        </Link>
      )}

      {listing.status === 'approved' && (
        <div className={styles.reportBox}>
          <ReportForm listingId={listing.id} t={t} />
        </div>
      )}
    </main>
  );
}
