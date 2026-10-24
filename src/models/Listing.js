import mongoose from 'mongoose';
import { LISTING_KINDS, LISTING_SOURCES, LISTING_STATUS, PAYMENTS, PLACE_TYPES, PLUG_TYPES, VEHICLES } from '@/lib/constants';

function isShared() {
  return this.kind === 'shared';
}

const listingSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: LISTING_KINDS, default: 'shared', index: true },
    source: { type: String, enum: LISTING_SOURCES, default: 'host' },
    osmId: { type: String, unique: true, sparse: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: isShared, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    operator: { type: String, trim: true },
    placeType: { type: String, enum: PLACE_TYPES, required: isShared },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) => value.length === 2 && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90,
          message: 'Location must be [longitude, latitude]',
        },
      },
    },
    address: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 100 },
    town: { type: String, trim: true },
    plugs: [{ type: String, enum: PLUG_TYPES }],
    vehicles: [{ type: String, enum: VEHICLES }],
    timings: {
      allDay: { type: Boolean, default: false },
      open: String,
      close: String,
      text: String,
    },
    pricePerHour: { type: Number, min: 1, required: isShared },
    payments: [{ type: String, enum: PAYMENTS }],
    priceNote: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, required: isShared },
    whatsapp: { type: String, trim: true },
    photos: [String],
    note: { type: String, trim: true, maxlength: 500 },
    isAvailable: { type: Boolean, default: true },
    status: { type: String, enum: LISTING_STATUS, default: 'pending' },
  },
  { timestamps: true }
);

listingSchema.path('plugs').validate(function (value) {
  return this.kind !== 'shared' || value.length > 0;
}, 'Pick at least one plug type');

listingSchema.path('vehicles').validate(function (value) {
  return this.kind !== 'shared' || value.length > 0;
}, 'Pick at least one vehicle type');

listingSchema.path('payments').validate(function (value) {
  return this.kind !== 'shared' || value.length > 0;
}, 'Pick UPI or cash');

listingSchema.index({ location: '2dsphere', status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Listing || mongoose.model('Listing', listingSchema);
