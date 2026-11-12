import { useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../../../convex/_generated/api'

const ERROR_COPY: Record<string, string> = {
  NOT_VERIFIED: 'Get ID-verified before scanning.',
  EXPIRED: 'That code expired — ask them to show a fresh one.',
  REUSED: 'That code was already used.',
  SELF_SCAN: "That's your own code.",
}

export function ScanPage() {
  const scanQr = useMutation(api.qr.scanQr)
  const navigate = useNavigate()
  const containerId = 'rs-qr-scanner'
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const busyRef = useRef(false)
  // html5-qrcode's stop() throws synchronously (not just a rejected promise)
  // when the camera never actually started — which is the common case in
  // headless/no-camera environments, and whenever the user navigates away
  // before the permission prompt resolves. Track readiness explicitly
  // instead of assuming .catch() will see it.
  const startedRef = useRef(false)
  const cancelledRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  async function safeStop(scanner: Html5Qrcode) {
    if (!startedRef.current) return
    startedRef.current = false
    try {
      await scanner.stop()
    } catch {
      // already stopped or never running — nothing to clean up
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 230 },
        async (text) => {
          if (busyRef.current) return
          busyRef.current = true
          try {
            const { interactionId } = await scanQr({ nonce: text })
            await safeStop(scanner)
            navigate(`/scan/result/${interactionId}`)
          } catch (e) {
            const code = e instanceof ConvexError ? (e.data as string) : undefined
            setError((code && ERROR_COPY[code]) ?? 'Could not read that code. Try again.')
            busyRef.current = false
          }
        },
        () => {},
      )
      .then(() => {
        startedRef.current = true
        // Unmounted while start() was still pending — stop it now, nothing
        // else will.
        if (cancelledRef.current) void safeStop(scanner)
      })
      .catch(() => setError('Camera access was denied or is unavailable.'))

    return () => {
      cancelledRef.current = true
      void safeStop(scanner)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/home" className="font-mono text-[11px] font-bold tracking-wide text-slate-400">
          ← HOME
        </Link>
        <div className="font-mono text-[11px] font-bold tracking-widest text-slate-400">SCAN</div>
      </div>

      <div id={containerId} ref={containerRef} className="mx-6 aspect-square overflow-hidden rounded-2xl bg-black" />

      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-red-950/60 px-4 py-3 text-center text-[13px] text-red-300">
          {error}
        </div>
      )}

      <p className="mt-6 px-6 text-center text-[12.5px] text-slate-400">
        Point your camera at the other rider&apos;s QR code.
      </p>
    </div>
  )
}
