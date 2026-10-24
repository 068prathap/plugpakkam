export default function manifest() {
  return {
    name: 'PlugPakkam',
    short_name: 'PlugPakkam',
    description: 'Find a plug near you to charge your EV.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f6f5',
    theme_color: '#0b8a45',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
