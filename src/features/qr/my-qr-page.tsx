import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { api } from '../../../convex/_generated/api'

export function MyQrPage() {
  const me = useQuery(api.profiles.getMe)
  const issueQr = useMutation(api.qr.issueQr)
  const confirmMeeting = useMutation(api.interactions.confirmMeeting)
  const cancelInteraction = useMutation(api.interactions.cancelInteraction)
  const openScan = useQuery(api.interactions.myOpenScan)
  const navigate = useNavigate()

  const [token, setToken] = useState<{ nonce: string; expiresAt: number } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const reduceMotion = useReducedMotion()

  async function refresh() {
    try {
      setToken(await issueQr())
    } catch {
      setError('Could not generate a code. Check your connection.')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching a fresh token on mount, not deriving state
    if (me?.verified) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.verified])

  useEffect(() => {
    if (!token) return
    const tick = () => setSecondsLeft(Math.max(0, Math.round((token.expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-issuing the token before it expires, not deriving state
    if (secondsLeft === 15) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  if (me === undefined) return null

  if (!me?.verified) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-ink p-8 text-center text-white">
        <div className="text-[15px] font-bold">Get verified to show your QR</div>
        <Link to="/verify" className="text-[13px] font-bold text-brand">
          Verify →
        </Link>
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-ink px-6 text-white">
      <Link to="/home" className="absolute left-6 top-6 text-[13px] font-semibold text-slate-400">
        ← Home
      </Link>

      <div className="flex flex-col items-center gap-1">
        <div className="text-[15px] font-bold">{me.displayName}</div>
        <div className="text-[12px] font-bold text-verified">✓ ID-verified</div>
      </div>

      {token && (
        <div className="rounded-2xl bg-white p-5">
          <QRCodeSVG value={token.nonce} size={200} />
          {/* e2e-only: lets a test read the nonce without decoding the QR image (SPEC.md §12) */}
          {import.meta.env.DEV && (
            <span data-testid="qr-nonce" className="hidden">
              {token.nonce}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2">
        <motion.span
          className="h-2 w-2 rounded-full bg-verified"
          animate={reduceMotion ? undefined : { opacity: [1, 0.4, 1] }}
          transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-[13px] font-bold">Refreshes in {secondsLeft}s</span>
      </div>

      <p className="max-w-[260px] text-center text-[12.5px] text-slate-400">
        This code expires automatically. A screenshot won&apos;t work.
      </p>

      {error && <div className="text-[12px] text-danger">{error}</div>}

      <AnimatePresence>
        {openScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-ink/90 p-6"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-[320px] rounded-2xl bg-paper p-6 text-ink"
            >
              <div className="text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Someone scanned your QR
                </div>
                <div className="mt-2 text-[18px] font-extrabold">{openScan.other?.displayName}</div>
              </div>

              {!openScan.interaction.bConfirmedAt ? (
                <div className="mt-4 rounded-lg bg-mist px-4 py-3 text-center text-[13px] text-slate">
                  Waiting for them to confirm it&apos;s you…
                </div>
              ) : (
                <>
                  <p className="mt-4 text-center text-[13px] text-slate">
                    Is this the person in front of you?
                  </p>
                  <div className="mt-4 flex gap-2">
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      onClick={() => cancelInteraction({ interactionId: openScan.interaction._id, reason: 'other' })}
                      className="flex-1 rounded-full border border-danger py-3 text-[14px] font-bold text-danger"
                    >
                      Not them
                    </motion.button>
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      disabled={confirming}
                      onClick={async () => {
                        setConfirming(true)
                        await confirmMeeting({ interactionId: openScan.interaction._id })
                        navigate(`/rate/${openScan.interaction._id}`)
                      }}
                      className="flex-1 rounded-full bg-verified py-3 text-[14px] font-bold text-white disabled:opacity-40"
                    >
                      Confirm
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
