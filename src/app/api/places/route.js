import { searchPlaces } from '@/lib/places';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return Response.json({ places: searchPlaces(searchParams.get('q')) });
}
