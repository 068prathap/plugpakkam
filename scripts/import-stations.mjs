import net from 'node:net';
import mongoose from 'mongoose';

net.setDefaultAutoSelectFamily(false);

const overpassQuery = `[out:json][timeout:180];
area["ISO3166-2"="IN-TN"]->.tn;
nwr["amenity"="charging_station"](area.tn);
out center tags;`;

const socketMap = {
  type2: 'type2',
  type2_cable: 'type2',
  type2_combo: 'ccs2',
  ccs: 'ccs2',
  chademo: 'chademo',
  type1: 'type1',
  type1_combo: 'ccs2',
  gb_t: 'gbt',
  gbt: 'gbt',
  gb_t_dc: 'gbt',
  bharat_dc001: 'gbt',
  bharat_ac001: 'ac001',
  cee_blue: 'ac001',
  iec_60309: 'ac001',
  typed: 'socket6a',
  type_d: 'socket6a',
  bs546: 'socket6a',
  typem: 'socket16a',
  type_m: 'socket16a',
  schuko: 'socket16a',
  type6: 'type6',
  type7: 'leccs',
  leccs: 'leccs',
};

function plugsFrom(tags) {
  const plugs = new Set();
  for (const key of Object.keys(tags)) {
    const match = key.match(/^socket:([a-z0-9_]+)$/);
    if (match && socketMap[match[1]] && tags[key] !== '0' && tags[key] !== 'no') plugs.add(socketMap[match[1]]);
  }
  return [...plugs];
}

function vehiclesFrom(tags, plugs) {
  const vehicles = new Set();
  if (tags.motorcar === 'yes' || plugs.some((plug) => ['type2', 'ccs2', 'chademo', 'gbt', 'type1'].includes(plug))) vehicles.add('4w');
  if (tags.scooter === 'yes' || tags.motorcycle === 'yes' || tags.moped === 'yes' || plugs.some((plug) => ['socket6a', 'socket16a', 'leccs', 'type6', 'ac001'].includes(plug))) vehicles.add('2w');
  if (plugs.includes('ac001') || plugs.includes('type6')) vehicles.add('3w');
  if (tags.bus === 'yes' || tags.hgv === 'yes') vehicles.add('bus');
  if (tags.bicycle === 'yes') vehicles.add('ecycle');
  if (vehicles.size === 0) vehicles.add('4w');
  return [...vehicles];
}

function timingsFrom(hours) {
  if (!hours) return {};
  if (hours.trim() === '24/7') return { allDay: true };
  return { allDay: false, text: hours.slice(0, 80) };
}

function phoneFrom(tags) {
  const raw = tags.phone || tags['contact:phone'] || '';
  let digits = raw.split(/[;,]/)[0].replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length >= 10 && digits.length <= 11 ? digits : '';
}

function nameFrom(tags) {
  const brand = tags.brand || tags.operator || tags.network;
  if (tags.name) return tags.name;
  if (brand) return /charg|station/i.test(brand) ? brand : `${brand} charging station`;
  return 'EV charging station';
}

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'PlugPakkam station import' },
  body: new URLSearchParams({ data: overpassQuery }),
});

if (!response.ok) {
  console.error('Overpass error', response.status, await response.text());
  process.exit(1);
}

const { elements } = await response.json();
const now = new Date();
const stations = elements
  .map((element) => {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (lat == null || lng == null) return null;

    const plugs = plugsFrom(tags);
    const phone = phoneFrom(tags);
    const fee = tags.charge || (tags.fee === 'no' ? 'Free' : '');

    return {
      osmId: `${element.type}/${element.id}`,
      kind: 'station',
      source: 'osm',
      name: nameFrom(tags).slice(0, 120),
      operator: tags.operator || tags.brand || tags.network || '',
      location: { type: 'Point', coordinates: [lng, lat] },
      address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb']].filter(Boolean).join(', '),
      town: tags['addr:city'] || tags['addr:district'] || '',
      plugs,
      vehicles: vehiclesFrom(tags, plugs),
      timings: timingsFrom(tags.opening_hours),
      priceNote: fee.slice(0, 120),
      phone,
      whatsapp: '',
      payments: [],
      photos: [],
      note: '',
      isAvailable: true,
      status: 'approved',
    };
  })
  .filter(Boolean);

await mongoose.connect(process.env.MONGODB_URI);
const listings = mongoose.connection.db.collection('listings');
await listings.createIndex({ location: '2dsphere', status: 1 });
await listings.createIndex({ osmId: 1 }, { unique: true, sparse: true });

if (stations.length > 0) {
  await listings.bulkWrite(
    stations.map((station) => ({
      updateOne: {
        filter: { osmId: station.osmId },
        update: { $set: { ...station, updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    }))
  );
}

const removed = await listings.deleteMany({ source: 'osm', osmId: { $nin: stations.map((station) => station.osmId) } });
const withPlugs = stations.filter((station) => station.plugs.length > 0).length;

console.log(`Imported ${stations.length} stations (${withPlugs} with plug info). Removed ${removed.deletedCount} old ones.`);
await mongoose.disconnect();
