// Haversine great-circle distance, in kilometers. A real formula — this
// is the one honestly "computed" part of the ride-request demo. What it's
// applied to is NOT real: there's no routing engine here, so it's a
// straight-line distance between two fixed points, not a street distance.
// Always labeled "straight-line" in the UI so it never reads as a routed
// ETA/distance.
export function haversineKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
