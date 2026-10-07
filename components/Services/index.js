import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

const NOTE_COLORS = ["pink", "blue", "green", "white", "orange", "purple"];
const NOTE_ROTATIONS = [-2.5, 1.8, -1.5, 2.2, -1.8, 1.2];

export default function Services() {
  const { lang } = useLanguage();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const services = (data.services || [])
    .filter((s) => s.published)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full flex flex-col">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="font-nunito font-extrabold text-3xl laptop:text-4xl text-[#1f2a37] tracking-tight mb-2">
          {lang === "en" ? "Services" : "Layanan"}
        </h2>
        <p className="font-raleway font-medium text-sm laptop:text-base text-[#4b5563]">
          {lang === "en"
            ? "What I can build and deliver for your company or project."
            : "Layanan yang bisa saya kerjakan untuk kebutuhan perusahaan atau proyek kamu."}
        </p>
      </div>

      {/* Sticky Notes Grid with AOS */}
      <div className="grid grid-cols-2 tablet:grid-cols-2 laptop:grid-cols-3 gap-6 items-start justify-items-center">
        {services.map((service, idx) => {
          const color = NOTE_COLORS[idx % NOTE_COLORS.length];
          const rotation = NOTE_ROTATIONS[idx % NOTE_ROTATIONS.length];
          const isHovered = activeTooltip === service.id;

          return (
            <div
              key={service.id || idx}
              data-aos="zoom-in-up"
              data-aos-delay={(idx % 3) * 80}
              data-aos-duration="500"
              className="relative w-full max-w-[200px]"
              onMouseEnter={() => setActiveTooltip(service.id)}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => setActiveTooltip(service.id)}
              onBlur={() => setActiveTooltip(null)}
              tabIndex={0}
              role="button"
              aria-label={service.title[lang]}
            >
              <motion.div
                style={{ rotate: rotation }}
                whileHover={{ rotate: 0, y: -6, scale: 1.04 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="sticky-note-wrapper cursor-pointer focus:outline-none"
              >
                <img
                  src={`/vectors/sticky-notes/note-${color}.svg`}
                  alt=""
                  aria-hidden="true"
                />
                <span className="note-text">{service.title[lang]}</span>
              </motion.div>

              {/* Tooltip description on hover */}
              <AnimatePresence>
                {isHovered && service.description?.[lang] && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 z-30 w-56 p-3.5 rounded-xl bg-[#1f2a37] text-white shadow-xl text-xs font-raleway leading-relaxed pointer-events-none text-center border border-white/10"
                  >
                    {service.description[lang]}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1f2a37]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
