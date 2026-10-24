'use server';

import mongoose from 'mongoose';
import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getDict } from '@/lib/lang';
import { notifyAdmin } from '@/lib/notify';
import { cleanPhone, isValidPhone } from '@/lib/format';
import { MAX_PHOTOS, PAYMENTS, PLACE_TYPES, PLUG_TYPES, VEHICLES } from '@/lib/constants';
import Listing from '@/models/Listing';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function readListing(formData) {
  return {
    name: formData.get('name')?.trim() || '',
    placeType: formData.get('placeType'),
    town: formData.get('town')?.trim() || '',
    address: formData.get('address')?.trim() || '',
    landmark: formData.get('landmark')?.trim() || '',
    lat: Number(formData.get('lat')),
    lng: Number(formData.get('lng')),
    plugs: formData.getAll('plugs').filter((plug) => PLUG_TYPES.includes(plug)),
    vehicles: formData.getAll('vehicles').filter((vehicle) => VEHICLES.includes(vehicle)),
    allDay: formData.get('allDay') === 'on',
    open: formData.get('open') || '',
    close: formData.get('close') || '',
    pricePerHour: formData.get('pricePerHour') || '',
    payments: formData.getAll('payments').filter((payment) => PAYMENTS.includes(payment)),
    phone: cleanPhone(formData.get('phone')),
    onWhatsapp: formData.get('onWhatsapp') === 'on',
    photos: formData
      .getAll('photos')
      .filter((url) => url.startsWith('https://res.cloudinary.com/'))
      .slice(0, MAX_PHOTOS),
    note: formData.get('note')?.trim() || '',
  };
}

function validateListing(values, t) {
  const errors = {};
  const hasLocation = values.lat && values.lng && Math.abs(values.lat) <= 90 && Math.abs(values.lng) <= 180;
  const price = Number(values.pricePerHour);

  if (!values.name || values.name.length > 80) errors.name = t.errors.name;
  if (!PLACE_TYPES.includes(values.placeType)) errors.placeType = t.errors.placeType;
  if (!values.town) errors.town = t.errors.town;
  if (!hasLocation) errors.location = t.errors.location;
  if (values.plugs.length === 0) errors.plugs = t.errors.plugs;
  if (values.vehicles.length === 0) errors.vehicles = t.errors.vehicles;
  if (!values.allDay && (!timePattern.test(values.open) || !timePattern.test(values.close) || values.open === values.close)) {
    errors.timings = t.errors.timings;
  }
  if (!Number.isFinite(price) || price < 1 || price > 10000) errors.pricePerHour = t.errors.price;
  if (values.payments.length === 0) errors.payments = t.errors.payments;
  if (!isValidPhone(values.phone)) errors.phone = t.errors.phone;

  return errors;
}

function toListingData(values) {
  return {
    kind: 'shared',
    source: 'host',
    name: values.name,
    placeType: values.placeType,
    town: values.town,
    address: values.address,
    landmark: values.landmark,
    location: { type: 'Point', coordinates: [values.lng, values.lat] },
    plugs: values.plugs,
    vehicles: values.vehicles,
    timings: values.allDay ? { allDay: true } : { allDay: false, open: values.open, close: values.close },
    pricePerHour: Math.round(Number(values.pricePerHour)),
    payments: values.payments,
    phone: values.phone,
    whatsapp: values.onWhatsapp ? values.phone : '',
    photos: values.photos,
    note: values.note,
  };
}

export async function saveListing(prevState, formData) {
  const user = await requireUser();
  const t = await getDict();
  const listingId = formData.get('listingId');
  const values = readListing(formData);
  const errors = validateListing(values, t);

  if (Object.keys(errors).length > 0) return { errors, values };
  if (listingId && !mongoose.isValidObjectId(listingId)) redirect('/host');

  await connectDB();
  const data = toListingData(values);
  let sentForReview = false;

  if (listingId) {
    const listing = await Listing.findOne({ _id: listingId, host: user.id });
    if (!listing) redirect('/host');
    listing.set(data);
    if (listing.status === 'rejected') {
      listing.status = 'pending';
      sentForReview = true;
    }
    await listing.save();
  } else {
    await Listing.create({ ...data, host: user.id });
    sentForReview = true;
  }

  if (sentForReview) {
    after(() =>
      notifyAdmin([
        listingId ? 'Place edited, needs approval again' : 'New place to approve',
        `${values.name}, ${values.town}`,
        `Rs ${data.pricePerHour}/hour · ${values.phone}`,
        `By ${user.name} (${user.phone})`,
      ])
    );
  }

  revalidatePath('/host');
  revalidatePath('/admin');
  if (listingId) revalidatePath(`/listing/${listingId}`);
  redirect('/host?saved=1');
}

async function findOwnListing(formData) {
  const user = await requireUser();
  const listingId = formData.get('listingId');
  if (!mongoose.isValidObjectId(listingId)) return null;

  await connectDB();
  return Listing.findOne({ _id: listingId, host: user.id });
}

export async function toggleAvailable(formData) {
  const listing = await findOwnListing(formData);
  if (!listing) return;

  listing.isAvailable = !listing.isAvailable;
  await listing.save();
  revalidatePath('/host');
  revalidatePath(`/listing/${listing.id}`);
}

export async function deleteListing(formData) {
  const listing = await findOwnListing(formData);
  if (!listing) return;

  await listing.deleteOne();
  revalidatePath('/host');
  revalidatePath('/admin');
}
