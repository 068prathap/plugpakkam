import L from 'leaflet';

const colors = {
  shared: { body: '#0b8a45', bolt: '#ffffff' },
  station: { body: '#0f1712', bolt: '#ffd23f' },
  paused: { body: '#9aa5a0', bolt: '#ffffff' },
};

export function pinIcon(className, kind = 'shared', selected = false) {
  const { body, bolt } = colors[kind];
  const size = selected ? 42 : 34;

  return L.divIcon({
    className,
    html: `<svg viewBox="0 0 32 40" width="${size}" height="${size * 1.25}"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 39 16 39s15-12 15-23.2C31 7.6 24.3 1 16 1Z" fill="${body}" stroke="#ffffff" stroke-width="2"/><path d="M18 7 10 18.5h5L13.5 26 22 14.5h-5L18 7Z" fill="${bolt}"/></svg>`,
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    tooltipAnchor: [size / 2, -size * 0.7],
  });
}
