'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TAMIL_NADU } from '@/lib/constants';
import { pinIcon } from '@/components/MapPin/pin';
import styles from './FinderMap.module.css';

const PIN_ZOOM = 10;
const LABEL_ZOOM = 13;

function Focus({ focus }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;
    const options = { paddingTopLeft: focus.paddingTopLeft, paddingBottomRight: focus.paddingBottomRight, maxZoom: focus.maxZoom || 15 };
    if (focus.bounds) map.flyToBounds(focus.bounds, { ...options, duration: 0.8 });
    else if (focus.center) map.flyTo([focus.center.lat, focus.center.lng], focus.zoom || 14, { duration: 0.8 });
  }, [map, focus]);

  return null;
}

function Watch({ onBoundsChange, onZoom, onMapClick }) {
  const map = useMapEvents({
    moveend() {
      report();
    },
    zoomend() {
      onZoom(map.getZoom());
    },
    click() {
      onMapClick();
    },
  });

  function report() {
    const bounds = map.getBounds();
    onBoundsChange({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
      center: map.getCenter(),
    });
  }

  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
      center: map.getCenter(),
    });
    onZoom(map.getZoom());
  }, [map, onBoundsChange, onZoom]);

  return null;
}

function FinderMap({ listings, focus, me, selectedId, hoveredId, onSelect, onBoundsChange }) {
  const [zoom, setZoom] = useState(7);

  const icons = useMemo(() => {
    const make = (kind, selected) => pinIcon(styles.pin, kind, selected);
    return {
      shared: make('shared', false),
      station: make('station', false),
      paused: make('paused', false),
      sharedSelected: make('shared', true),
      stationSelected: make('station', true),
      pausedSelected: make('paused', true),
    };
  }, []);

  function iconFor(listing) {
    const kind = listing.kind === 'station' ? 'station' : listing.isAvailable ? 'shared' : 'paused';
    const active = listing.id === selectedId || listing.id === hoveredId;
    return icons[active ? `${kind}Selected` : kind];
  }

  return (
    <MapContainer bounds={TAMIL_NADU.bounds} className={styles.map} zoomControl={false} attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Focus focus={focus} />
      <Watch onBoundsChange={onBoundsChange} onZoom={setZoom} onMapClick={() => onSelect(null)} />

      {me && (
        <>
          <CircleMarker center={[me.lat, me.lng]} radius={18} pathOptions={{ stroke: false, fillColor: '#2563eb', fillOpacity: 0.15 }} interactive={false} />
          <CircleMarker center={[me.lat, me.lng]} radius={7} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} interactive={false} />
        </>
      )}

      {zoom < PIN_ZOOM
        ? listings.map((listing) => (
            <CircleMarker
              key={listing.id}
              center={[listing.lat, listing.lng]}
              radius={5}
              pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: listing.kind === 'station' ? '#0f1712' : '#0b8a45', fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(listing.id) }}
            />
          ))
        : listings.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={iconFor(listing)}
              zIndexOffset={listing.id === selectedId ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(listing.id) }}
            >
              {zoom >= LABEL_ZOOM && (
                <Tooltip permanent direction="right" className={styles.label} interactive={false}>
                  {listing.name}
                </Tooltip>
              )}
            </Marker>
          ))}
    </MapContainer>
  );
}

export default FinderMap;
