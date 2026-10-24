import { connectDB } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import Listing from '@/models/Listing';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const home = { url: siteUrl, changeFrequency: 'daily', priority: 1 };

  try {
    await connectDB();
    const listings = await Listing.find({ status: 'approved' }, '_id updatedAt').lean();
    return [
      home,
      ...listings.map((listing) => ({
        url: `${siteUrl}/listing/${listing._id}`,
        lastModified: listing.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })),
    ];
  } catch {
    return [home];
  }
}
