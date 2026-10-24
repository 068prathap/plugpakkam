'use client';

import { useActionState, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { saveListing } from '@/app/actions/listings';
import { PAYMENTS, PLACE_TYPES, PLUG_TYPES, VEHICLES } from '@/lib/constants';
import Field from '@/components/Field/Field';
import PhotoUpload from '@/components/PhotoUpload/PhotoUpload';
import TownSearch from '@/components/TownSearch/TownSearch';
import styles from '@/styles/form.module.css';
import ownStyles from './ListingForm.module.css';

const PinPicker = dynamic(() => import('@/components/PinPicker/PinPicker'), {
  ssr: false,
  loading: () => <div className={ownStyles.mapLoading} />,
});

const emptyListing = {
  placeType: 'shop',
  plugs: [],
  vehicles: ['2w'],
  allDay: false,
  open: '09:00',
  close: '21:00',
  payments: ['upi', 'cash'],
  onWhatsapp: true,
  photos: [],
};

function toFormValues(listing) {
  if (!listing) return emptyListing;
  return {
    ...listing,
    allDay: listing.timings.allDay,
    open: listing.timings.open,
    close: listing.timings.close,
    onWhatsapp: !!listing.whatsapp,
  };
}

function ListingForm({ listing, t, lang }) {
  const initial = toFormValues(listing);
  const [state, formAction, isPending] = useActionState(saveListing, { errors: {}, values: initial });
  const { errors = {}, values = {} } = state;
  const [position, setPosition] = useState(listing ? { lat: listing.lat, lng: listing.lng } : null);
  const [photos, setPhotos] = useState(initial.photos);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [locating, setLocating] = useState(false);
  const [mapView, setMapView] = useState(null);
  const townRef = useRef(null);

  function showTown(place) {
    setMapView({ lat: place.lat, lng: place.lng });
    if (townRef.current && !townRef.current.value) townRef.current.value = place.label;
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {listing && <input type="hidden" name="listingId" value={listing.id} />}

      <div className={styles.section}>
        <Field label={t.form.name} name="name" defaultValue={values.name} error={errors.name} maxLength={80} placeholder={t.form.namePlaceholder} />
        <Field label={t.form.placeType} name="placeType" error={errors.placeType}>
          <select id="placeType" name="placeType" defaultValue={values.placeType}>
            {PLACE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.places[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.form.town} name="town" defaultValue={values.town} error={errors.town} autoComplete="address-level2" ref={townRef} />
        <div className={styles.row}>
          <Field label={t.form.address} name="address" defaultValue={values.address} maxLength={200} />
          <Field label={t.form.landmark} name="landmark" defaultValue={values.landmark} maxLength={100} placeholder={t.form.landmarkPlaceholder} />
        </div>
      </div>

      <div className={styles.section}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.location}</legend>
          <p className={styles.hint}>{t.form.locationHint}</p>
          <TownSearch t={t} lang={lang} onPick={showTown} />
          <div className={ownStyles.mapBox}>
            <PinPicker value={position} view={mapView} onChange={setPosition} />
            <button type="button" className={ownStyles.locate} onClick={locateMe}>
              {locating ? '...' : t.form.useLocation}
            </button>
          </div>
          <input type="hidden" name="lat" value={position?.lat ?? ''} />
          <input type="hidden" name="lng" value={position?.lng ?? ''} />
          {errors.location && <p className={styles.error}>{errors.location}</p>}
        </fieldset>
      </div>

      <div className={styles.section}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.plugs}</legend>
          <div className={styles.choices}>
            {PLUG_TYPES.map((plug) => (
              <label key={plug} className={styles.choice}>
                <input type="checkbox" name="plugs" value={plug} defaultChecked={values.plugs?.includes(plug)} />
                {t.plugs[plug]}
              </label>
            ))}
          </div>
          {errors.plugs && <p className={styles.error}>{errors.plugs}</p>}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.vehicles}</legend>
          <div className={styles.choices}>
            {VEHICLES.map((vehicle) => (
              <label key={vehicle} className={styles.choice}>
                <input type="checkbox" name="vehicles" value={vehicle} defaultChecked={values.vehicles?.includes(vehicle)} />
                {t.vehicles[vehicle]}
              </label>
            ))}
          </div>
          {errors.vehicles && <p className={styles.error}>{errors.vehicles}</p>}
        </fieldset>
      </div>

      <div className={styles.section}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.timings}</legend>
          <label className={styles.check}>
            <input type="checkbox" name="allDay" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
            {t.form.allDay}
          </label>
          {!allDay && (
            <div className={styles.row}>
              <Field label={t.form.opens} name="open" type="time" defaultValue={values.open} />
              <Field label={t.form.closes} name="close" type="time" defaultValue={values.close} />
            </div>
          )}
          {errors.timings && <p className={styles.error}>{errors.timings}</p>}
        </fieldset>

        <Field
          label={t.form.pricePerHour}
          name="pricePerHour"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          defaultValue={values.pricePerHour}
          error={errors.pricePerHour}
          placeholder={t.form.pricePlaceholder}
        />

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.payments}</legend>
          <div className={styles.choices}>
            {PAYMENTS.map((payment) => (
              <label key={payment} className={styles.choice}>
                <input type="checkbox" name="payments" value={payment} defaultChecked={values.payments?.includes(payment)} />
                {t.payments[payment]}
              </label>
            ))}
          </div>
          {errors.payments && <p className={styles.error}>{errors.payments}</p>}
        </fieldset>
      </div>

      <div className={styles.section}>
        <Field
          label={t.form.phone}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          defaultValue={values.phone}
          error={errors.phone}
          hint={t.form.phoneHint}
        />
        <label className={styles.check}>
          <input type="checkbox" name="onWhatsapp" defaultChecked={values.onWhatsapp} />
          {t.form.onWhatsapp}
        </label>
      </div>

      <div className={styles.section}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t.form.photos}</legend>
          <p className={styles.hint}>{t.form.photosHint}</p>
          <PhotoUpload photos={photos} onChange={setPhotos} t={t} />
        </fieldset>
        <Field label={t.form.note} name="note">
          <textarea id="note" name="note" defaultValue={values.note} maxLength={500} placeholder={t.form.notePlaceholder} />
        </Field>
      </div>

      {Object.keys(errors).length > 0 && <p className={styles.formError}>{t.errors.form}</p>}

      <div className={styles.actions}>
        <Link href="/host" className={styles.cancel}>
          {t.form.cancel}
        </Link>
        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? t.form.saving : listing ? t.form.save : t.form.add}
        </button>
      </div>
      {!listing && <p className={styles.note}>{t.form.reviewNote}</p>}
    </form>
  );
}

export default ListingForm;
