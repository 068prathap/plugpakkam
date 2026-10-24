'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PLUG_FILTERS, VEHICLES } from '@/lib/constants';
import { metersBetween } from '@/lib/format';
import ListingCard from '@/components/ListingCard/ListingCard';
import PreviewCard from '@/components/PreviewCard/PreviewCard';
import TownSearch from '@/components/TownSearch/TownSearch';
import styles from './Finder.module.css';

const FinderMap = dynamic(() => import('@/components/FinderMap/FinderMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading} />,
});

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('No geolocation'));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

function filterParams(filters) {
  const params = new URLSearchParams();
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.plug) params.set('plug', filters.plug);
  return params;
}

function mapPadding() {
  const wide = window.matchMedia('(min-width: 900px)').matches;
  return wide
    ? { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60] }
    : { paddingTopLeft: [30, 150], paddingBottomRight: [30, Math.round(window.innerHeight * 0.36)] };
}

function Finder({ t, lang }) {
  const [me, setMe] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationOff, setLocationOff] = useState(false);
  const [focus, setFocus] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [filters, setFilters] = useState({ kind: '', vehicle: '', plug: '' });
  const [result, setResult] = useState({ key: '', listings: [], error: false });
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const focusNearest = useCallback(async (point) => {
    const params = filterParams(filtersRef.current);
    params.set('near', `${point.lat},${point.lng}`);
    try {
      const response = await fetch(`/api/listings?${params}`);
      const { listings = [] } = await response.json();
      const points = [point, ...listings].map((item) => [item.lat, item.lng]);
      if (listings.length === 0) setFocus({ key: Date.now(), center: point, zoom: 13, ...mapPadding() });
      else setFocus({ key: Date.now(), bounds: points, maxZoom: 15, ...mapPadding() });
    } catch {
      setFocus({ key: Date.now(), center: point, zoom: 13, ...mapPadding() });
    }
  }, []);

  const locateMe = useCallback(async () => {
    setLocating(true);
    try {
      const point = await getPosition();
      setMe(point);
      setOrigin(point);
      setLocationOff(false);
      await focusNearest(point);
    } catch {
      setLocationOff(true);
    }
    setLocating(false);
  }, [focusNearest]);

  useEffect(() => {
    let cancelled = false;
    const permissions = navigator.permissions?.query({ name: 'geolocation' }) || Promise.resolve({ state: 'prompt' });

    permissions
      .catch(() => ({ state: 'prompt' }))
      .then((permission) => {
        if (cancelled) return;
        if (permission.state === 'denied') {
          setLocationOff(true);
          setLocating(false);
        } else {
          locateMe();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locateMe]);

  const params = filterParams(filters);
  if (bounds) {
    params.set('box', [bounds.west, bounds.south, bounds.east, bounds.north].map((value) => value.toFixed(3)).join(','));
  }
  const key = bounds ? params.toString() : '';

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/listings?${key}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error('Failed');
          return response.json();
        })
        .then((data) => setResult({ key, listings: data.listings, error: false }))
        .catch((error) => {
          if (error.name !== 'AbortError') setResult({ key, listings: [], error: true });
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  const from = origin || bounds?.center;
  const listings = result.listings
    .map((listing) => ({ ...listing, distance: from ? metersBetween(from, listing) : null }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  const loading = !!key && result.key !== key && result.listings.length === 0;
  const selected = listings.find((listing) => listing.id === selectedId);

  function pickPlace(place) {
    setOrigin(place);
    setSelectedId(null);
    focusNearest(place);
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function select(id) {
    setSelectedId(id);
    if (id) setSheetOpen(false);
  }

  return (
    <div className={styles.app}>
      <aside className={`${styles.panel} ${sheetOpen ? styles.open : ''}`}>
        <div className={styles.controls}>
          <h1 className={styles.heading}>{t.appTagline}</h1>
          <TownSearch t={t} lang={lang} label={origin?.label} onPick={pickPlace} />

          <div className={styles.chips}>
            <div className={styles.segment} role="group">
              {[
                ['', t.finder.all],
                ['shared', t.finder.shared],
                ['station', t.finder.stations],
              ].map(([value, label]) => (
                <button key={value || 'all'} type="button" aria-pressed={filters.kind === value} onClick={() => updateFilter('kind', value)}>
                  {label}
                </button>
              ))}
            </div>

            <label className={`${styles.chip} ${filters.vehicle ? styles.chipOn : ''}`}>
              <span className="sr-only">{t.finder.vehicle}</span>
              <select value={filters.vehicle} onChange={(event) => updateFilter('vehicle', event.target.value)}>
                <option value="">{t.finder.vehicle}</option>
                {VEHICLES.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>
                    {t.vehicles[vehicle]}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${styles.chip} ${filters.plug ? styles.chipOn : ''}`}>
              <span className="sr-only">{t.finder.plug}</span>
              <select value={filters.plug} onChange={(event) => updateFilter('plug', event.target.value)}>
                <option value="">{t.finder.plug}</option>
                {PLUG_FILTERS.map((plug) => (
                  <option key={plug} value={plug}>
                    {t.plugFilters[plug]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={styles.sheet}>
          <button type="button" className={styles.handle} onClick={() => setSheetOpen(!sheetOpen)} aria-expanded={sheetOpen}>
            <span />
            <b>
              {loading ? t.finder.loading : `${listings.length} ${listings.length === 1 ? t.finder.countOne : t.finder.count}`}
            </b>
          </button>

          <div className={styles.list}>
            {locationOff && !origin && <p className={styles.notice}>{t.finder.locationOff}</p>}
            {result.error && <p className={styles.notice}>{t.finder.loadError}</p>}
            {!loading && !result.error && listings.length === 0 && (
              <div className={styles.empty}>
                <p>{t.finder.empty}</p>
                <p>{t.finder.emptyHint}</p>
              </div>
            )}
            <ul>
              {listings.slice(0, 60).map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} t={t} selected={listing.id === selectedId} onHover={setHoveredId} />
                </li>
              ))}
            </ul>
            <div className={styles.share}>
              <div>
                <b>{t.finder.shareTitle}</b>
                <p>{t.finder.shareText}</p>
              </div>
              <Link href="/host/new">{t.finder.shareButton}</Link>
            </div>
          </div>
        </div>
      </aside>

      <section className={styles.mapArea} aria-label="Map">
        <FinderMap listings={listings} focus={focus} me={me} selectedId={selectedId} hoveredId={hoveredId} onSelect={select} onBoundsChange={setBounds} />

        <button type="button" className={`${styles.locate} ${me ? styles.locateOn : ''}`} onClick={locateMe} disabled={locating} aria-label={t.finder.useLocation} title={t.finder.useLocation}>
          {locating ? (
            <span className={styles.spinner} />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm1-6v2.06A8 8 0 0 1 19.94 11H22v2h-2.06A8 8 0 0 1 13 19.94V22h-2v-2.06A8 8 0 0 1 4.06 13H2v-2h2.06A8 8 0 0 1 11 4.06V2h2Zm-1 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" fill="currentColor" />
            </svg>
          )}
        </button>

        {selected && (
          <div className={styles.preview}>
            <PreviewCard listing={selected} t={t} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </section>
    </div>
  );
}

export default Finder;
