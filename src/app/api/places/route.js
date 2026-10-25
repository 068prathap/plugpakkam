import { searchOtherPlaces, searchPlaces } from '@/lib/places';
import { searchListings } from '@/lib/listings';
import { metersBetween } from '@/lib/format';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const towns = searchPlaces(q, 6);
  const [spots, others] = await Promise.all([searchListings(q).catch(() => []), searchOtherPlaces(q)]);
  const stem = (name) => name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 7);
  const extra = others.filter(
    (other, index) =>
      !towns.some((town) => stem(town.name) === stem(other.name) && metersBetween(town, other) < 15000) &&
      others.findIndex((item) => item.name === other.name) === index
  );

  return Response.json({ spots, towns, others: extra.slice(0, 4) });
}
