import { searchOtherPlaces, searchPlaces } from '@/lib/places';
import { searchListings } from '@/lib/listings';
import { metersBetween } from '@/lib/format';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const towns = searchPlaces(q, 6);
  const [spots, others] = await Promise.all([searchListings(q).catch(() => []), searchOtherPlaces(q)]);
  const extra = others.filter((other) => !towns.some((town) => town.name === other.name && metersBetween(town, other) < 3000));

  return Response.json({ spots, towns, others: extra.slice(0, 4) });
}
