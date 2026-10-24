import 'server-only';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { LISTING_KINDS, PLUG_TYPES, SOCKET_PLUGS, VEHICLES } from '@/lib/constants';
import Listing from '@/models/Listing';

export function toListing(doc) {
  return {
    id: doc._id.toString(),
    kind: doc.kind || 'shared',
    source: doc.source || 'host',
    host: doc.host?.toString() || null,
    name: doc.name,
    operator: doc.operator || '',
    placeType: doc.placeType || '',
    lat: doc.location.coordinates[1],
    lng: doc.location.coordinates[0],
    address: doc.address || '',
    landmark: doc.landmark || '',
    town: doc.town || '',
    plugs: doc.plugs || [],
    vehicles: doc.vehicles || [],
    timings: {
      allDay: !!doc.timings?.allDay,
      open: doc.timings?.open || '',
      close: doc.timings?.close || '',
      text: doc.timings?.text || '',
    },
    pricePerHour: doc.pricePerHour || null,
    payments: doc.payments || [],
    priceNote: doc.priceNote || '',
    phone: doc.phone || '',
    whatsapp: doc.whatsapp || '',
    photos: doc.photos || [],
    note: doc.note || '',
    isAvailable: doc.isAvailable !== false,
    status: doc.status,
    distance: doc.distance,
  };
}

function buildQuery({ kind, vehicle, plug }) {
  const query = { status: 'approved' };
  if (LISTING_KINDS.includes(kind)) query.kind = kind;
  if (VEHICLES.includes(vehicle)) query.vehicles = vehicle;
  if (plug === 'socket') query.plugs = { $in: SOCKET_PLUGS };
  else if (PLUG_TYPES.includes(plug)) query.plugs = plug;
  return query;
}

export async function findNearest({ lat, lng, limit, ...filters }) {
  await connectDB();
  await Listing.init();

  const docs = await Listing.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        query: buildQuery(filters),
        key: 'location',
        spherical: true,
      },
    },
    { $limit: limit },
  ]);

  return docs.map(toListing);
}

export async function findInBox({ west, south, east, north, ...filters }) {
  await connectDB();
  await Listing.init();

  const docs = await Listing.find({
    ...buildQuery(filters),
    location: { $geoWithin: { $box: [[west, south], [east, north]] } },
  })
    .limit(500)
    .lean();

  return docs.map(toListing);
}

export async function getListing(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Listing.findById(id).lean();
  return doc ? toListing(doc) : null;
}

export async function getHostListings(hostId) {
  await connectDB();
  const docs = await Listing.find({ host: hostId }).sort({ createdAt: -1 }).lean();
  return docs.map(toListing);
}
