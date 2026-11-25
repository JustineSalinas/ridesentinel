// Fixed, hand-picked Iloilo City landmarks for the "Where to?" destination
// picker — not a real places/geocoding search. Same "simulated, not real"
// rule as convex/lib/iloiloRoute.ts: a short, honest list of real places,
// with real coordinates, but no live search or address autocomplete.
export type IloiloDestination = {
  name: string
  area: string
  lng: number
  lat: number
}

export const ILOILO_DESTINATIONS: IloiloDestination[] = [
  { name: 'SM City Iloilo', area: 'Mandurriao', lng: 122.5586, lat: 10.7007 },
  { name: 'Festive Walk Iloilo', area: 'Mandurriao', lng: 122.554, lat: 10.6965 },
  { name: 'Robinsons Place Iloilo', area: 'City Proper', lng: 122.5661, lat: 10.6971 },
  { name: 'Iloilo City Proper / Esplanade', area: 'City Proper', lng: 122.5721, lat: 10.6968 },
  { name: 'Jaro Cathedral', area: 'Jaro', lng: 122.5649, lat: 10.7294 },
  { name: 'La Paz Public Market', area: 'La Paz', lng: 122.5675, lat: 10.7135 },
]

// Fallback pickup point when the browser denies/lacks geolocation — Jaro
// Plaza, the same start point as the fixed demo route in
// convex/lib/iloiloRoute.ts, so the two features stay visually consistent.
export const DEFAULT_PICKUP = { name: 'Jaro Plaza (demo pickup)', lng: 122.5644, lat: 10.7297 }
