'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TAMIL_NADU } from '@/lib/constants';
import { pinIcon } from '@/components/MapPin/pin';
import styles from './PinPicker.module.css';

function ClickToPlace({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16));
  }, [map, position]);

  return null;
}

function ShowPlace({ view }) {
  const map = useMap();

  useEffect(() => {
    if (view) map.flyTo([view.lat, view.lng], 15, { duration: 0.8 });
  }, [map, view]);

  return null;
}

function PinPicker({ value, view, onChange }) {
  const icon = useMemo(() => pinIcon(styles.pin), []);
  const start = value || TAMIL_NADU.center;

  return (
    <MapContainer center={[start.lat, start.lng]} zoom={value ? 16 : 7} className={styles.map}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={onChange} />
      <FlyTo position={value} />
      <ShowPlace view={view} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(event) {
              const { lat, lng } = event.target.getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

export default PinPicker;
