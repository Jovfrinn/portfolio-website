import React from "react";
import { motion } from "framer-motion";

// Bar heights mirror the exact clamp()/line-height formulas from hero.css
// (.hero-badge, .hero-title, .hero-sub-main, .hero-sub-desc, .hero-btn) so
// swapping to the real text doesn't shift the layout.
const BADGE_H = "calc(clamp(13px, 1.05vw, 16px) + 16px)";
const TITLE_LINE_H = "calc(clamp(44px, 6.2vw, 96px) * 1.05)";
const SUB_LINE_H = "calc(clamp(20px, 2.2vw, 32px) * 1.3)";
const DESC_LINE_H = "calc(clamp(14px, 1.2vw, 17px) * 1.5)";
const BTN_H = "calc(clamp(15px, 1.15vw, 18px) + clamp(14px, 1.2vw, 18px) * 2)";

export default function HeroTextSkeleton({ reducedMotion }) {
  const bar = `hero-skel-bar${reducedMotion ? " hero-skel-static" : ""}`;

  return (
    <motion.div
      className="w-full flex flex-col items-start"
      aria-hidden="true"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className={`${bar} w-44 mb-6`} style={{ height: BADGE_H }} />

      <div className={`${bar} w-[85%] mb-1`} style={{ height: TITLE_LINE_H }} />
      <div className={`${bar} w-[55%]`} style={{ height: TITLE_LINE_H, marginBottom: 18 }} />

      <div className={`${bar} w-[75%] mb-1`} style={{ height: SUB_LINE_H }} />
      <div className={`${bar} w-[45%]`} style={{ height: SUB_LINE_H, marginBottom: 12 }} />

      <div className={`${bar} w-[90%] mb-2`} style={{ height: DESC_LINE_H }} />
      <div className={`${bar} w-[75%]`} style={{ height: DESC_LINE_H, marginBottom: 32 }} />

      <div className="flex items-center gap-4">
        <div className={`${bar} w-36`} style={{ height: BTN_H }} />
        <div className={`${bar} w-32`} style={{ height: BTN_H }} />
      </div>
    </motion.div>
  );
}
