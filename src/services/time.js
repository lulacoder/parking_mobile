export function toMs(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
}

export function toDateTime(value) {
  const ms = toMs(value);
  if (!ms) return 'N/A';
  return new Date(ms).toLocaleString();
}

export function nowPlusMinutes(minutes) {
  return Date.now() + minutes * 60 * 1000;
}

export function normalizePlate(value) {
  return String(value || '').trim().toUpperCase();
}

export function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parkingCoords(parking) {
  if (!parking) return null;
  const loc = parking.location || {};
  const lat = toNumber(loc.lat) ?? toNumber(loc.latitude) ?? toNumber(loc._lat) ?? toNumber(parking.lat) ?? toNumber(parking.latitude);
  const lng = toNumber(loc.lng) ?? toNumber(loc.longitude) ?? toNumber(loc._long) ?? toNumber(parking.lng) ?? toNumber(parking.longitude);
  if (lat == null || lng == null) return null;
  return { latitude: lat, longitude: lng };
}

export function estimateCharge(entryTime, hourlyRate = 50) {
  const entryMs = toMs(entryTime);
  const durationMinutes = Math.max(1, Math.ceil((Date.now() - entryMs) / 60000));
  const billedHours = Math.max(1, Math.ceil(durationMinutes / 60));
  return {
    durationMinutes,
    billedHours,
    amountDue: billedHours * Number(hourlyRate || 50),
  };
}
