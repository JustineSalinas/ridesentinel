import { useEffect, useState } from 'react'

/**
 * SPEC.md §7: QR/scan/rating screens never work offline and never cache
 * their data — this banner is the one honest thing to show instead.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      className="bg-ink px-4 py-2 text-center text-[13px] font-semibold text-white"
    >
      You're offline — a data connection is needed for RideSentinel to work.
    </div>
  )
}
