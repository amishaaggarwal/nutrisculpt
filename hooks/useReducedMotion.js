import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Returns true when the user has requested reduced motion.
 * Wraps Framer Motion's hook so the rest of the app depends on a single,
 * stable utility rather than importing framer-motion in every component.
 */
export function useReducedMotion() {
  return useFramerReducedMotion();
}

/**
 * Returns Framer Motion variants that honour reduced motion.
 * When reduced motion is requested, entrance/scale motions are removed so the
 * content still appears without disorienting translation or scaling.
 */
export function reducedMotionVariants(reduced) {
  return {
    entrance: reduced
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: reduced ? {} : { scale: 1.02 },
  };
}
