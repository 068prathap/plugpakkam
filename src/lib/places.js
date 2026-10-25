import 'server-only';
import places from '@/data/places.json';

function clean(text) {
  return text.toLowerCase().replace(/[^a-z஀-௿]/g, '');
}

const index = places.map((place) => ({
  place,
  keys: [place.name, place.ta, ...(place.aka || [])].filter(Boolean).map(clean),
}));

export function searchPlaces(query, limit = 8) {
  const q = clean(query || '');
  if (q.length < 2) return [];

  const matches = [];
  for (const { place, keys } of index) {
    let score = null;
    for (const key of keys) {
      if (key === q) score = 0;
      else if (key.startsWith(q)) score = Math.min(score ?? 1, 1);
      else if (key.includes(q)) score = Math.min(score ?? 2, 2);
    }
    if (score !== null) matches.push({ place, score: score * 3 + place.rank });
  }

  return matches
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ place }) => ({ name: place.name, ta: place.ta || '', area: place.area || '', lat: place.lat, lng: place.lng }));
}

export async function searchOtherPlaces(query) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q, limit: '8', bbox: '76.2,8.05,80.4,13.6', lang: 'en' });
  try {
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: AbortSignal.timeout(2500),
      headers: { 'User-Agent': 'PlugPakkam (plugpakkam.in)' },
      next: { revalidate: 86400 },
    });
    const data = await response.json();

    return data.features
      .filter((feature) => feature.properties.state === 'Tamil Nadu' && feature.properties.name)
      .map(({ properties, geometry }) => ({
        name: properties.name,
        area: [properties.street, properties.city || properties.district || properties.county].filter(Boolean).join(', '),
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
      }))
      .slice(0, 5);
  } catch {
    return [];
  }
}
