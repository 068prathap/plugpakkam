/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: import.meta.dirname },
  devIndicators: false,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.js',
  },
};

export default nextConfig;
