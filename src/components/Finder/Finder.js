'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PLUG_FILTERS, VEHICLES } from '@/lib/constants';
import { metersBetween } from '@/lib/format';
import FilterChip from '@/components/FilterChip/FilterChip';
import ListingCard from '@/components/ListingCard/ListingCard';
import PreviewCard from '@/components/PreviewCard/PreviewCard';
import TownSearch from '@/components/TownSearch/TownSearch';
import styles from './Finder.module.css';

const FinderMap = dynamic(() => import('@/components/FinderMap/FinderMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading} />,
});

const STORE_KEY = 'plugpakkam-finder';
const PEEK = 104;
const SHEET_STATES = ['peek', 'half', 'full'];

function readSaved() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
    if (saved && Date.now() - saved.at < 6 * 60 * 60 * 1000) return saved;
  } catch {}
  return null;
}

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

function isWide() {
  return window.matchMedia('(min-width: 900px)').matches;
}

function mapPadding() {
  return isWide()
    ? { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60] }
    : { paddingTopLeft: [30, 130], paddingBottomRight: [30, PEEK + 40] };
}

function padBox(view) {
  const width = view.east - view.west;
  const height = view.north - view.south;
  return {
    west: view.west - width / 2,
    east: view.east + width / 2,
    south: view.south - height / 2,
    north: view.north + height / 2,
    zoom: view.zoom,
  };
}

function covers(box, view) {
  return box && box.west <= view.west && box.east >= view.east && box.south <= view.south && box.north >= view.north && view.zoom - box.zoom < 3;
}

function inView(listing, view) {
  return listing.lat >= view.south && listing.lat <= view.north && listing.lng >= view.west && listing.lng <= view.east;
}

function Finder({ t, lang }) {
  const [saved] = useState(readSaved);
  const [me, setMe] = useState(saved?.me || null);
  const [origin, setOrigin] = useState(saved?.origin || null);
  const [locating, setLocating] = useState(!saved);
  const [locationOff, setLocationOff] = useState(false);
  const [toast, setToast] = useState('');
  const [focus, setFocus] = useState(null);
  const [view, setView] = useState(null);
  const [queryBox, setQueryBox] = useState(null);
  const [filters, setFilters] = useState(saved?.filters || { kind: '', vehicle: '', plug: '' });
  const [result, setResult] = useState({ key: '', listings: [], error: false });
  const [selectedId, setSelectedId] = useState(saved?.selectedId || null);
  const [hoveredId, setHoveredId] = useState(null);
  const [sheet, setSheet] = useState(saved?.sheet || 'peek');
  const filtersRef = useRef(filters);
  const sheetRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!view) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ at: Date.now(), view: { center: view.center, zoom: view.zoom }, me, origin, filters, selectedId, sheet })
      );
    } catch {}
  }, [view, me, origin, filters, selectedId, sheet]);

  const focusNearest = useCallback(async (point) => {
    const params = filterParams(filtersRef.current);
    params.set('near', `${point.lat},${point.lng}`);
    try {
      const response = await fetch(`/api/listings?${params}`);
      const { listings = [] } = await response.json();
      if (listings.length === 0) setFocus({ center: point, zoom: 13 });
      else setFocus({ bounds: [point, ...listings].map((item) => [item.lat, item.lng]), maxZoom: 15, ...mapPadding() });
    } catch {
      setFocus({ center: point, zoom: 13 });
    }
  }, []);

  const locateMe = useCallback(
    async (fromButton) => {
      setLocating(true);
      setToast('');
      try {
        const point = await getPosition();
        setMe(point);
        setOrigin(null);
        setSelectedId(null);
        setLocationOff(false);
        await focusNearest(point);
      } catch (error) {
        setLocationOff(true);
        if (fromButton === true) {
          if (!window.isSecureContext) setToast(t.finder.locationNeedsHttps);
          else if (error?.code === 1) setToast(t.finder.locationBlocked);
          else setToast(t.finder.locationFailed);
        }
      }
      setLocating(false);
    },
    [focusNearest, t]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (saved) return;
    let cancelled = false;
    const permission = navigator.permissions?.query({ name: 'geolocation' }) || Promise.resolve({ state: 'prompt' });

    permission
      .catch(() => ({ state: 'prompt' }))
      .then(({ state }) => {
        if (cancelled) return;
        if (state === 'denied') {
          setLocationOff(true);
          setLocating(false);
        } else {
          locateMe();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [saved, locateMe]);

  const handleView = useCallback((next) => {
    setView(next);
    setQueryBox((current) => (covers(current, next) ? current : padBox(next)));
  }, []);

  const params = filterParams(filters);
  if (queryBox) params.set('box', [queryBox.west, queryBox.south, queryBox.east, queryBox.north].map((value) => value.toFixed(3)).join(','));
  const key = queryBox ? params.toString() : '';

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
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  const from = origin || me;
  const sortFrom = from || view?.center;
  const withDistance = result.listings.map((listing) => ({ ...listing, distance: from ? metersBetween(from, listing) : null }));
  const visible = view
    ? withDistance
        .filter((listing) => inView(listing, view))
        .map((listing) => ({ listing, order: metersBetween(sortFrom, listing) }))
        .sort((a, b) => a.order - b.order)
        .map(({ listing }) => listing)
    : [];
  const loading = !!key && result.key !== key && result.listings.length === 0;
  const selected = withDistance.find((listing) => listing.id === selectedId);

  const select = useCallback((id) => {
    setSelectedId(id);
    if (id) setSheet('peek');
  }, []);

  function pickPlace(place) {
    setOrigin(place);
    setSelectedId(null);
    setSheet('peek');
    focusNearest(place);
  }

  function pickSpot(spot) {
    setSelectedId(spot.id);
    setSheet('peek');
    setFocus({ center: spot, zoom: 16, offsetY: isWide() ? 0 : 90 });
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function sheetOffset(state) {
    const height = sheetRef.current?.offsetHeight || 0;
    if (state === 'full') return 0;
    if (state === 'half') return Math.round(height * 0.5);
    return height - PEEK;
  }

  function startDrag(event) {
    if (isWide() || !sheetRef.current) return;
    drag.current = { y: event.clientY, start: sheetOffset(sheet), offset: sheetOffset(sheet), moved: false };
    sheetRef.current.style.transition = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!drag.current) return;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dy) > 5) drag.current.moved = true;
    const max = sheetOffset('peek');
    drag.current.offset = Math.min(max, Math.max(0, drag.current.start + dy));
    sheetRef.current.style.transform = `translateY(${drag.current.offset}px)`;
  }

  function endDrag() {
    const current = drag.current;
    drag.current = null;
    if (!current || !sheetRef.current) return;
    sheetRef.current.style.transition = '';
    sheetRef.current.style.transform = '';

    if (!current.moved) {
      setSheet(SHEET_STATES[(SHEET_STATES.indexOf(sheet) + 1) % SHEET_STATES.length]);
      return;
    }

    const nearest = SHEET_STATES.reduce((best, state) =>
      Math.abs(sheetOffset(state) - current.offset) < Math.abs(sheetOffset(best) - current.offset) ? state : best
    );
    setSheet(nearest);
  }

  const vehicleOptions = VEHICLES.map((vehicle) => ({ value: vehicle, label: t.vehicles[vehicle] }));
  const plugOptions = PLUG_FILTERS.map((plug) => ({ value: plug, label: t.plugFilters[plug] }));
  const countText = loading ? t.finder.loading : `${visible.length} ${visible.length === 1 ? t.finder.countOne : t.finder.count}`;

  return (
    <div className={`${styles.app} ${selected ? styles.hasSelection : ''}`} data-sheet={sheet}>
      <div className={styles.panel}>
        <div className={styles.controls}>
          <p className={styles.heading}>{t.appTagline}</p>
          <TownSearch t={t} lang={lang} onPick={pickPlace} onPickSpot={pickSpot} compact />

          <div className={styles.chips}>
            <div className={styles.segment} role="group" aria-label={t.finder.all}>
              {[
                ['', t.finder.all],
                ['shared', t.finder.shared, t.finder.sharedShort],
                ['station', t.finder.stations],
              ].map(([value, label, shortLabel]) => (
                <button key={value || 'all'} type="button" aria-pressed={filters.kind === value} onClick={() => updateFilter('kind', value)}>
                  {shortLabel ? (
                    <>
                      <span className={styles.long}>{label}</span>
                      <span className={styles.short}>{shortLabel}</span>
                    </>
                  ) : (
                    label
                  )}
                </button>
              ))}
            </div>
            <FilterChip label={t.finder.vehicle} anyLabel={t.finder.anyVehicle} value={filters.vehicle} options={vehicleOptions} onChange={(value) => updateFilter('vehicle', value)} />
            <FilterChip label={t.finder.plug} anyLabel={t.finder.anyPlug} value={filters.plug} options={plugOptions} onChange={(value) => updateFilter('plug', value)} />
          </div>
        </div>

        <div className={styles.sheet} ref={sheetRef}>
          <div className={styles.handle} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <span className={styles.grip} />
            <b>{countText}</b>
          </div>

          <div className={styles.list}>
            {locationOff && !origin && <p className={styles.notice}>{t.finder.locationOff}</p>}
            {result.error && <p className={styles.notice}>{t.finder.loadError}</p>}
            {!loading && !result.error && visible.length === 0 && (
              <div className={styles.empty}>
                <p>{t.finder.empty}</p>
                <p>{t.finder.emptyHint}</p>
              </div>
            )}
            <ul>
              {visible.slice(0, 60).map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} t={t} selected={listing.id === selectedId} onSelect={() => select(listing.id)} onHover={setHoveredId} />
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
      </div>

      <section className={styles.mapArea} aria-label="Map">
        <FinderMap
          listings={withDistance}
          initialView={saved?.view}
          focus={focus}
          me={me}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={select}
          onViewChange={handleView}
        />

        <button type="button" className={`${styles.locate} ${me && !origin ? styles.locateOn : ''}`} onClick={() => locateMe(true)} disabled={locating} aria-label={t.finder.useLocation} title={t.finder.useLocation}>
          {locating ? (
            <span className={styles.spinner} />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm1-6v2.06A8 8 0 0 1 19.94 11H22v2h-2.06A8 8 0 0 1 13 19.94V22h-2v-2.06A8 8 0 0 1 4.06 13H2v-2h2.06A8 8 0 0 1 11 4.06V2h2Zm-1 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" fill="currentColor" />
            </svg>
          )}
        </button>

        {toast && (
          <p className={styles.toast} role="status">
            {toast}
          </p>
        )}

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
