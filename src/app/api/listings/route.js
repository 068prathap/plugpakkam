import { findInBox, findNearest } from '@/lib/listings';
import { NEAREST_COUNT } from '@/lib/constants';

function readNumbers(value, count) {
  const numbers = String(value || '').split(',').map(Number);
  return numbers.length === count && numbers.every(Number.isFinite) ? numbers : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    kind: searchParams.get('kind'),
    vehicle: searchParams.get('vehicle'),
    plug: searchParams.get('plug'),
  };
  const near = readNumbers(searchParams.get('near'), 2);
  const box = readNumbers(searchParams.get('box'), 4);

  try {
    if (near && Math.abs(near[0]) <= 90 && Math.abs(near[1]) <= 180) {
      const listings = await findNearest({ lat: near[0], lng: near[1], limit: NEAREST_COUNT, ...filters });
      return Response.json({ listings });
    }

    if (box) {
      const [west, south, east, north] = box;
      const listings = await findInBox({ west, south, east, north, ...filters });
      return Response.json({ listings });
    }

    return Response.json({ error: 'near or box is required' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Could not load places' }, { status: 500 });
  }
}
