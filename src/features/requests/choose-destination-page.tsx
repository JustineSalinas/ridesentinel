import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Navigation, Search } from 'lucide-react'
import { Map, MapMarker, MarkerContent, MapRoute, type MapRef } from '@/components/ui/map'
import { ILOILO_DESTINATIONS, DEFAULT_PICKUP, type IloiloDestination } from '@/lib/iloilo-destinations'
import { haversineKm } from '@/lib/geo'

type Point = { lng: number; lat: number }

// ChooseDestinationPage: a "Where to?" picker shown before Request a
// ride. Tries the browser's real geolocation for the pickup pin (a
// genuine device location, when granted); falls back to a fixed Jaro
// Plaza point otherwise. The destination side is a short fixed list of
// real Iloilo City landmarks, not a places/address search — there's no
// geocoding API behind this. The distance shown is a real haversine
// straight-line calculation between the two points, always labeled
// "straight-line" so it never reads as a routed ETA/distance the way the
// ride-request's own fare/ETA mock numbers do.
export function ChooseDestinationPage() {
  const navigate = useNavigate()
  const mapRef = useRef<MapRef | null>(null)
  const [pickup, setPickup] = useState<Point & { name: string }>(DEFAULT_PICKUP)
  const [pickupSource, setPickupSource] = useState<'device' | 'fallback'>('fallback')
  const [selected, setSelected] = useState<IloiloDestination | null>(null)
  const [customNote, setCustomNote] = useState('')

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickup({ name: 'Your current location', lng: pos.coords.longitude, lat: pos.coords.latitude })
        setPickupSource('device')
      },
      () => {
        // Permission denied or unavailable — keep the fixed fallback pin.
      },
      { timeout: 8000 },
    )
  }, [])

  const distanceKm = selected ? haversineKm(pickup, selected) : null

  // Fit both pins in view every time the destination (or pickup) changes —
  // a fixed center/zoom broke this the first time: a pickup/destination
  // pair far enough apart at a "normal" zoom level rendered both markers
  // outside the visible map container. Polls briefly for the map instance
  // since it loads maplibre-gl asynchronously and may not be ready the
  // instant this effect runs.
  useEffect(() => {
    if (!selected) return
    let cancelled = false
    function tryFit() {
      if (cancelled) return
      const map = mapRef.current
      if (!map) {
        requestAnimationFrame(tryFit)
        return
      }
      const lngs = [pickup.lng, selected.lng]
      const lats = [pickup.lat, selected.lat]
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 56, duration: 0 },
      )
    }
    tryFit()
    return () => {
      cancelled = true
    }
  }, [selected, pickup.lng, pickup.lat])

  function confirm() {
    const note = selected ? `${selected.name}, ${selected.area}` : customNote.trim()
    navigate('/request', { state: { note } })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-page">
      <div className="flex items-center gap-3 px-6 py-5">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="tap-feedback flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-mist hover:text-ink"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <div className="text-[18px] font-extrabold text-ink">Where to?</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8">
        <div className="neu-in flex items-center gap-2.5 rounded-2xl px-4 py-3">
          <Search size={16} strokeWidth={2.2} className="flex-shrink-0 text-slate" />
          <input
            value={selected ? `${selected.name}, ${selected.area}` : customNote}
            onChange={(e) => {
              setSelected(null)
              setCustomNote(e.target.value.slice(0, 200))
            }}
            placeholder="Type a destination or pick one below"
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-slate outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-[11.5px] text-slate">
          <Navigation size={12} strokeWidth={2.4} className="flex-shrink-0" />
          {pickupSource === 'device' ? 'Using your current location' : 'Using a demo pickup point (location unavailable)'}
        </div>

        {selected && (
          <div className="neu-out-sm overflow-hidden rounded-2xl">
            <div className="relative h-48 overflow-hidden">
              <Map
                ref={mapRef}
                className="h-full w-full"
                theme="light"
                viewport={{ center: [(pickup.lng + selected.lng) / 2, (pickup.lat + selected.lat) / 2], zoom: 11, bearing: 0, pitch: 0 }}
              >
                <MapRoute coordinates={[[pickup.lng, pickup.lat], [selected.lng, selected.lat]]} color="#94a3b8" width={2.5} dashArray={[1, 1.5]} />
                <MapMarker longitude={pickup.lng} latitude={pickup.lat}>
                  <MarkerContent>
                    <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-brand shadow" />
                  </MarkerContent>
                </MapMarker>
                <MapMarker longitude={selected.lng} latitude={selected.lat}>
                  <MarkerContent>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow-lg">
                      <MapPin size={14} strokeWidth={2.6} />
                    </div>
                  </MarkerContent>
                </MapMarker>
              </Map>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-ink">{selected.name}</div>
                <div className="text-[11.5px] text-slate">{selected.area}, Iloilo City</div>
              </div>
              {distanceKm !== null && (
                <div className="text-right">
                  <div className="text-[14px] font-extrabold text-ink">{distanceKm.toFixed(1)} km</div>
                  <div className="text-[10px] text-slate/80">straight-line estimate</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-semibold text-slate">Suggested destinations</div>
          {ILOILO_DESTINATIONS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => setSelected(d)}
              className={`tap-feedback flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                selected?.name === d.name ? 'bg-blue-50' : 'hover:bg-mist/40'
              }`}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mist">
                <MapPin size={14} strokeWidth={2.2} className="text-slate" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold text-ink">{d.name}</div>
                <div className="text-[11px] text-slate">{d.area}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={!selected && !customNote.trim()}
          className="tap-feedback mt-auto flex h-[52px] items-center justify-center gap-1.5 rounded-xl bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          Confirm destination
          <ArrowRight size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}
