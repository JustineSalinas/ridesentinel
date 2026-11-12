import { useRef } from 'react'
import { useInView, useReducedMotion, type MotionProps } from 'framer-motion'

/** Scroll-reveal: fades/slides an element in once it enters the viewport. */
export function useReveal(options?: { delay?: number }): {
  ref: React.RefObject<HTMLElement | null>
  motionProps: MotionProps
} {
  const ref = useRef<HTMLElement | null>(null)
  // Positive bottom margin expands the trigger zone below the viewport, so
  // content starts revealing well before it's scrolled into view. Tall
  // stacked sections (e.g. three full-height phone mockups) could otherwise
  // sit fully transparent for 1000px+ of scroll, reading as a broken/empty
  // page rather than an animation — found during a full design-review pass.
  const inView = useInView(ref, { once: true, margin: '0px 0px 400px 0px' })
  const reduceMotion = useReducedMotion()

  return {
    ref,
    motionProps: {
      initial: reduceMotion ? false : { opacity: 0, y: 16 },
      animate: inView ? { opacity: 1, y: 0 } : undefined,
      transition: { duration: 0.4, delay: options?.delay ?? 0, ease: 'easeOut' },
    },
  }
}
