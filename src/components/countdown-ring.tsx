import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const DURATION_S = 60
const RADIUS = 15
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * A real ticking countdown ring — not decoration. It loops 60 -> 0 to
 * visualize the actual QR-handshake expiry the hero copy describes, so the
 * hero reads as a live product state instead of a static poster.
 */
export function CountdownRing({ className }: { className?: string }) {
  const circleRef = useRef<SVGCircleElement>(null)
  const textRef = useRef<SVGTextElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const circle = circleRef.current
    const text = textRef.current
    if (!circle || !text) return

    let raf: number
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = ((now - start) / 1000) % DURATION_S
      const remaining = Math.ceil(DURATION_S - elapsed)
      const fraction = elapsed / DURATION_S
      circle.style.strokeDashoffset = String(CIRCUMFERENCE * fraction)
      text.textContent = String(remaining)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion])

  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
      <circle
        ref={circleRef}
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={reduceMotion ? CIRCUMFERENCE * 0.25 : 0}
        transform="rotate(-90 18 18)"
      />
      <text
        ref={textRef}
        x="18"
        y="19"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-current font-mono"
        style={{ fontSize: '11px', fontWeight: 700 }}
      >
        60
      </text>
    </svg>
  )
}
