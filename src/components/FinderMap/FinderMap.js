'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    if (focus.bounds) {
      map.flyToBounds(focus.bounds, { ...options, duration: 0.8 });
    } else if (focus.center) {
      const zoom = focus.zoom || map.getZoom();
      const target = focus.offsetY ? map.unproject(map.project([focus.center.lat, focus.center.lng], zoom).add([0, focus.offsetY]), zoom) : [focus.center.lat, focus.center.lng];
      map.flyTo(target, zoom, { duration: 0.6 });
    }
  }, [map, focus]);

  return null;
}

function readView(map) {
  const bounds = map.getBounds();
  const center = map.getCenter();
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
    center: { lat: center.lat, lng: center.lng },
    zoom: map.getZoom(),
  };
}

function Watch({ onViewChange, onMapClick }) {
  const map = useMapEvents({
    moveend() {
      onViewChange(readView(map));
    },
    click() {
      onMapClick();
    },
  });

  useEffect(() => {
    onViewChange(readView(map));
  }, [map, onViewChange]);

  return null;
}

function FinderMap({ listings, initialView, focus, me, selectedId, hoveredId, onSelect, onViewChange }) {
  const [zoom, setZoom] = useState(initialView?.zoom || 7);
  const handleView = useCallback(
    (view) => {
      setZoom(view.zoom);
      onViewChange(view);
    },
    [onViewChange]
  );
  const clearSelection = useCallback(() => onSelect(null), [onSelect]);

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

  const start = initialView ? { center: [initialView.center.lat, initialView.center.lng], zoom: initialView.zoom } : { bounds: TAMIL_NADU.bounds };

  return (
    <MapContainer {...start} className={styles.map} zoomControl={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Focus focus={focus} />
      <Watch onViewChange={handleView} onMapClick={clearSelection} />

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
              radius={listing.id === selectedId ? 8 : 5}
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
