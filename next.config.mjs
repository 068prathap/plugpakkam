/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: import.meta.dirname },
  devIndicators: false,
  allowedDevOrigins: ['10.15.220.123', '*.trycloudflare.com'],
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.js',
  },
};

export default nextConfig;
