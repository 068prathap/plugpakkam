import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { dictionary } from '@/lib/dictionary';
import { toListing } from '@/lib/listings';
import { directionsLink, priceText, timingsText } from '@/lib/format';
import { resolveReport, setListingStatus } from '@/app/actions/admin';
import { signOut } from '@/app/actions/auth';
import Listing from '@/models/Listing';
import Report from '@/models/Report';
import '@/models/User';
import styles from './page.module.css';

export const metadata = {
  title: 'Admin',
  robots: { index: false },
};

async function getAdminData() {
  await connectDB();
  const [pending, reports, approvedCount, pendingCount, stationCount] = await Promise.all([
    Listing.find({ status: 'pending' }).sort({ createdAt: 1 }).populate('host', 'phone name').lean(),
    Report.find({ status: 'open' }).sort({ createdAt: -1 }).populate('listing', 'name town').lean(),
    Listing.countDocuments({ status: 'approved' }),
    Listing.countDocuments({ status: 'pending' }),
    Listing.countDocuments({ kind: 'station', status: 'approved' }),
  ]);

  return {
    pending: pending.map((doc) => ({ ...toListing({ ...doc, host: doc.host?._id }), hostName: doc.host ? `${doc.host.name} (${doc.host.phone})` : '' })),
    reports: reports.map((report) => ({
      id: report._id.toString(),
      reason: report.reason,
      note: report.note,
      createdAt: report.createdAt,
      listingId: report.listing?._id.toString(),
      listingName: report.listing ? `${report.listing.name}, ${report.listing.town}` : 'Deleted place',
    })),
    approvedCount,
    pendingCount,
    stationCount,
  };
}

function dateText(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

export default async function AdminPage() {
  await requireAdmin();
  const [{ pending, reports, approvedCount, pendingCount, stationCount }, t] = await Promise.all([getAdminData(), dictionary.en]);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <h1>Admin</h1>
        <div className={styles.topLinks}>
          <Link href="/admin/password">Change password</Link>
          <form action={signOut}>
            <input type="hidden" name="admin" value="1" />
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>
      <div className={styles.stats}>
        <p>
          <b>{approvedCount - stationCount}</b> shared live
        </p>
        <p>
          <b>{stationCount}</b> stations
        </p>
        <p>
          <b>{pendingCount}</b> waiting
        </p>
        <p>
          <b>{reports.length}</b> open reports
        </p>
      </div>

      <h2>Waiting for approval</h2>
      {pending.length === 0 && <p className={styles.empty}>Nothing to check.</p>}
      <ul className={styles.list}>
        {pending.map((listing) => (
          <li key={listing.id} className={styles.card}>
            <div className={styles.photos}>
              {listing.photos.map((url) => (
                <div key={url} className={styles.photo}>
                  <Image src={url} alt="" fill sizes="96px" />
                </div>
              ))}
            </div>
            <h3>{listing.name}</h3>
            <p>
              {t.places[listing.placeType]} · {listing.town} · {listing.hostName}
            </p>
            <p>{listing.plugs.map((plug) => t.plugs[plug]).join(', ')} · {listing.vehicles.map((vehicle) => t.vehicles[vehicle]).join(', ')}</p>
            <p>
              {timingsText(listing.timings, t)} · {priceText(listing, t)} ({listing.payments.map((payment) => t.payments[payment]).join(', ')}) · {listing.phone}
            </p>
            {listing.address && <p>{listing.address}</p>}
            {listing.note && <p className={styles.note}>{listing.note}</p>}
            <div className={styles.actions}>
              <a href={directionsLink(listing.lat, listing.lng)} target="_blank" rel="noopener noreferrer">
                See on map
              </a>
              <Link href={`/listing/${listing.id}`}>Preview</Link>
              <form action={setListingStatus}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className={styles.reject}>
                  Reject
                </button>
              </form>
              <form action={setListingStatus}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" className={styles.approve}>
                  Approve
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <h2>Reports</h2>
      {reports.length === 0 && <p className={styles.empty}>No open reports.</p>}
      <ul className={styles.list}>
        {reports.map((report) => (
          <li key={report.id} className={styles.card}>
            <h3>{t.reasons[report.reason]}</h3>
            <p>
              {report.listingId ? <Link href={`/listing/${report.listingId}`}>{report.listingName}</Link> : report.listingName} · {dateText(report.createdAt)}
            </p>
            {report.note && <p className={styles.note}>{report.note}</p>}
            <div className={styles.actions}>
              {report.listingId && (
                <form action={setListingStatus}>
                  <input type="hidden" name="listingId" value={report.listingId} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" className={styles.reject}>
                    Hide place
                  </button>
                </form>
              )}
              <form action={resolveReport}>
                <input type="hidden" name="reportId" value={report.id} />
                <button type="submit">Mark done</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
