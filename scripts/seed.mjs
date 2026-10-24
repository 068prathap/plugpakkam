import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is missing in .env.local');
  process.exit(1);
}

if (!/127\.0\.0\.1|localhost/.test(uri) && process.env.FORCE_SEED !== '1') {
  console.error('This is not a local database. Sample places are only for testing on your computer.');
  process.exit(1);
}

const seedPhone = '6000000000';

const places = [
  { name: 'Sample: Sri Murugan Bakery', placeType: 'shop', town: 'Tiruchengode', landmark: 'Near new bus stand', lat: 11.3802, lng: 77.8941, plugs: ['socket6a'], vehicles: ['2w', 'ecycle'], timings: { allDay: false, open: '06:00', close: '22:00' }, pricePerHour: 20, payments: ['upi', 'cash'] },
  { name: 'Sample: Kumar Textiles', placeType: 'shop', town: 'Tiruchengode', landmark: 'Sankari road', lat: 11.3756, lng: 77.8990, plugs: ['socket6a', 'socket16a'], vehicles: ['2w', '3w'], timings: { allDay: false, open: '09:00', close: '20:30' }, pricePerHour: 15, payments: ['cash'] },
  { name: 'Sample: Selvam House', placeType: 'home', town: 'Tiruchengode', landmark: 'Behind temple car street', lat: 11.3851, lng: 77.8902, plugs: ['socket16a'], vehicles: ['2w'], timings: { allDay: false, open: '07:00', close: '21:00' }, pricePerHour: 25, payments: ['upi'] },
  { name: 'Sample: Hotel Annapoorna', placeType: 'hotel', town: 'Tiruchengode', landmark: 'Erode main road', lat: 11.3724, lng: 77.8858, plugs: ['type2', 'socket16a'], vehicles: ['2w', '4w'], timings: { allDay: true }, pricePerHour: 60, payments: ['upi', 'cash'] },
  { name: 'Sample: Velan Mobiles', placeType: 'shop', town: 'Erode', landmark: 'Perundurai road', lat: 11.3428, lng: 77.7155, plugs: ['socket6a'], vehicles: ['2w'], timings: { allDay: false, open: '10:00', close: '21:30' }, pricePerHour: 20, payments: ['upi', 'cash'] },
  { name: 'Sample: Lakshmi Apartments', placeType: 'apartment', town: 'Namakkal', landmark: 'Salem road', lat: 11.2214, lng: 78.1660, plugs: ['socket16a', 'ac001'], vehicles: ['2w', '3w'], timings: { allDay: false, open: '06:00', close: '22:00' }, pricePerHour: 25, payments: ['upi'] },
  { name: 'Sample: Salem Tea Stall', placeType: 'shop', town: 'Salem', landmark: 'Five roads junction', lat: 11.6680, lng: 78.1438, plugs: ['socket6a'], vehicles: ['2w', 'ecycle'], timings: { allDay: false, open: '05:30', close: '23:00' }, pricePerHour: 15, payments: ['cash'] },
];

await mongoose.connect(uri);
const db = mongoose.connection.db;

const now = new Date();
const { value: user } = await db.collection('users').findOneAndUpdate(
  { phone: seedPhone },
  { $setOnInsert: { phone: seedPhone, name: 'Sample host', role: 'host', passwordHash: 'not-for-login', sessionVersion: 0, createdAt: now, updatedAt: now } },
  { upsert: true, returnDocument: 'after', includeResultMetadata: true }
);

const listings = db.collection('listings');
await listings.createIndex({ location: '2dsphere', status: 1 });
await listings.deleteMany({ host: user._id });

await listings.insertMany(
  places.map(({ lat, lng, ...place }) => ({
    ...place,
    kind: 'shared',
    source: 'host',
    host: user._id,
    location: { type: 'Point', coordinates: [lng, lat] },
    address: '',
    phone: '9876543210',
    whatsapp: '9876543210',
    photos: [],
    note: 'Sample place for testing. Not real.',
    isAvailable: true,
    status: 'approved',
    createdAt: now,
    updatedAt: now,
  }))
);

console.log(`Added ${places.length} sample places.`);
await mongoose.disconnect();
