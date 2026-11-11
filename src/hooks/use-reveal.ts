import { useRef } from 'react'
import { useInView, useReducedMotion, type MotionProps } from 'framer-motion'

/** Scroll-reveal: fades/slides an element in once it enters the viewport. */
export function useReveal(options?: { delay?: number }): {
  ref: React.RefObject<HTMLElement | null>
  motionProps: MotionProps
} {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
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
