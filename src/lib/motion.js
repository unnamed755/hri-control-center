/**
 * One motion language for the whole product.
 * Fast, smooth, restrained — no bouncing, no decorative jitter.
 */
export const EASE = [0.22, 1, 0.36, 1]
export const EASE_SOFT = [0.4, 0, 0.2, 1]

export const DUR = {
  micro: 0.16,
  fast: 0.24,
  base: 0.36,
  slow: 0.52,
  chart: 900,
  count: 1100,
}

export const SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }
export const SPRING_SOFT = { type: 'spring', stiffness: 220, damping: 26 }

export const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE, staggerChildren: 0.055, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE_SOFT } },
}

export const staggerContainer = (stagger = 0.055, delayChildren = 0.04) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren } },
  exit: {},
})

export const fadeUp = (distance = 14, duration = DUR.base) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: DUR.micro } },
})

export const fadeIn = (duration = DUR.base) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration, ease: EASE } },
  exit: { opacity: 0, transition: { duration: DUR.micro } },
})

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.fast, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: DUR.micro, ease: EASE_SOFT } },
}

export const slideRight = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: DUR.base, ease: EASE } },
  exit: { x: '100%', transition: { duration: DUR.fast, ease: EASE_SOFT } },
}

export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.fast } },
  exit: { opacity: 0, transition: { duration: DUR.fast } },
}

export const dropdownVariants = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.micro, ease: EASE } },
  exit: { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12 } },
}

export const rowVariants = {
  initial: { opacity: 0, y: 6 },
  animate: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.fast, ease: EASE, delay: Math.min(i, 14) * 0.018 },
  }),
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

export const hoverLift = {
  whileHover: { y: -3, transition: { duration: DUR.micro, ease: EASE } },
  whileTap: { scale: 0.995 },
}

export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.97 },
  transition: SPRING,
}
