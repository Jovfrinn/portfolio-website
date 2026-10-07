import React from "react";
import { motion } from "framer-motion";

// Plain rectangular placeholder -- mirrors .hero-stage exactly (same
// parent, no independent sizing) so there is no layout shift when the real
// illustration takes over. Hidden on mobile/tablet via CSS (hero.css),
// where only the text skeleton shows.
export default function HeroSkeleton({ reducedMotion }) {
  return (
    <motion.div
      className={`hero-skel${reducedMotion ? " hero-skel-static" : ""}`}
      aria-hidden="true"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    />
  );
}
