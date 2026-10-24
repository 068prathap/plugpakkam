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
