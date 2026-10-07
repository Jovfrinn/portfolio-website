import React from "react";
import { motion } from "framer-motion";

// Mirrors .hero-stage exactly (same parent, no independent sizing) so there
// is no layout shift when the real illustration takes over.
export default function HeroSkeleton({ reducedMotion }) {
  return (
    <motion.div
      className={`hero-skel${reducedMotion ? " hero-skel-static" : ""}`}
      aria-hidden="true"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="hero-skel-window" />
      <div className="hero-skel-desk" />
      <div className="hero-skel-person" />
    </motion.div>
  );
}
