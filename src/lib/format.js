import { SOCKET_PLUGS } from '@/lib/constants';

export function cleanPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

export function callLink(phone) {
  return phone.length === 10 ? `tel:+91${phone}` : `tel:${phone}`;
}

export function whatsappLink(phone, message) {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export function directionsLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function metersBetween(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function distanceText(meters) {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  if (meters < 100000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function nowInIndia() {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return toMinutes(time);
}

export function isOpenNow(timings) {
  if (timings?.allDay) return true;
  if (!timings?.open || !timings?.close) return null;

  const now = nowInIndia();
  const open = toMinutes(timings.open);
  const close = toMinutes(timings.close);

  if (open <= close) return now >= open && now < close;
  return now >= open || now < close;
}

export function timeText(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function timingsText(timings, t) {
  if (timings?.allDay) return t.listing.allDay;
  if (timings?.open && timings?.close) return `${timeText(timings.open)} - ${timeText(timings.close)}`;
  return timings?.text || t.listing.unknown;
}

export function priceText(listing, t) {
  if (listing.pricePerHour) return `₹${listing.pricePerHour} ${t.listing.perHour}`;
  return listing.priceNote || '';
}

export function hasSocket(plugs) {
  return plugs.some((plug) => SOCKET_PLUGS.includes(plug));
}
