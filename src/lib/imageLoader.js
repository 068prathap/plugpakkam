export default function imageLoader({ src, width, quality }) {
  if (!src.includes('res.cloudinary.com')) return src;
  return src.replace('/upload/', `/upload/f_auto,q_${quality || 'auto'},w_${width},c_limit/`);
}
