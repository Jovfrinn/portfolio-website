import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

const STAMP_SVGS = {
  github: "/vectors/contact/stamp-github.svg",
  linkedin: "/vectors/contact/stamp-linkedin.svg",
  whatsapp: "/vectors/contact/stamp-whatsapp.svg",
  email: "/vectors/contact/stamp-email.svg",
};

// Scatter targets (px offset from the flap-mouth origin) + float timing per stamp
const STAMP_FX = {
  github: { x: -105, y: -75, rotate: -9, floatDuration: 2.5, floatDelay: 0 },
  linkedin: { x: 105, y: -80, rotate: 8, floatDuration: 2.8, floatDelay: 0.2 },
  whatsapp: { x: -110, y: 85, rotate: -7, floatDuration: 2.6, floatDelay: 0.4 },
  email: { x: 110, y: 90, rotate: 9, floatDuration: 2.9, floatDelay: 0.1 },
};

const OPEN_LAYERS = "/vectors/contact/open";
// Timings lifted from references/contact/open/demo.html:
// opening is staged (seal breaks -> closed flap collapses -> open flap reveals),
// closing reverts everything together, quickly.
const FLAP_ORIGIN = "50% 39.15%";

export default function Contact() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // Mouse users: hover opens/closes. Touch users: tap toggles (no real hover state).
  // Decided once per device so a tap doesn't fight a synthetic hover event.
  const supportsHoverRef = React.useRef(
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches,
  );

  const title = data.socials_section?.title?.[lang] || "Let's Connect";
  const description = data.socials_section?.description?.[lang];

  const connectSocials = (data.socials || [])
    .filter((s) => s.published && s.placement === "connect_grid")
    .sort((a, b) => a.order - b.order);

  const ctaSocials = (data.socials || [])
    .filter((s) => s.published && s.placement === "footer_cta")
    .sort((a, b) => a.order - b.order);

  const emailSocial = (data.socials || []).find(
    (s) => s.title?.toLowerCase() === "email",
  );
  const emailHref = emailSocial?.link || "mailto:jovfrinjoiner01@gmail.com";

  return (
    <div id="contact" className="w-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-nunito font-extrabold text-3xl laptop:text-4xl text-[#1f2a37] tracking-tight mb-2">
          {title}
        </h2>
        {description && (
          <p className="font-raleway font-medium text-sm laptop:text-base text-[#4b5563]">
            {description}
          </p>
        )}
      </div>

      {/* Envelope & Stamps Section */}
      <div className="rounded-2xl bg-white border border-[#e5dac8] p-5 tablet:p-6 shadow-[0_4px_24px_rgba(31,42,55,0.05)] mb-6">
        <div
          className="envelope-container py-6 cursor-pointer select-none"
          onMouseEnter={() => supportsHoverRef.current && setIsOpen(true)}
          onMouseLeave={() => supportsHoverRef.current && setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false);
          }}
          onClick={() => !supportsHoverRef.current && setIsOpen((v) => !v)}
        >
          <div className="relative w-full max-w-[300px] aspect-[440/470] mx-auto">
            {/* Envelope stack: gentle continuous float while open. Layers bottom to top
                (see references/contact/open/README.md): back, flap-open, front pocket,
                flap-closed, seal. Stamps render as a sibling above everything. */}
            <motion.div
              className="absolute inset-0 filter drop-shadow-md"
              animate={
                isOpen
                  ? { y: [0, -8, 0], rotate: [0, -1, 0, 1, 0] }
                  : { y: 0, rotate: 0 }
              }
              transition={
                isOpen
                  ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.95 }
                  : { duration: 0.4, ease: "easeOut" }
              }
            >
              <img
                src={`${OPEN_LAYERS}/1-envelope-back.svg`}
                alt=""
                className="absolute inset-0 w-full h-full z-0"
              />

              <motion.img
                src={`${OPEN_LAYERS}/2-flap-open.svg`}
                alt=""
                className="absolute inset-0 w-full h-full z-10"
                style={{ transformOrigin: FLAP_ORIGIN }}
                animate={{ scaleY: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                transition={{
                  duration: 0.25,
                  ease: isOpen ? "easeOut" : "easeIn",
                  delay: isOpen ? 0.7 : 0,
                }}
              />

              <img
                src={`${OPEN_LAYERS}/4-envelope-front.svg`}
                alt="Envelope"
                className="absolute inset-0 w-full h-full z-20"
              />

              <motion.img
                src={`${OPEN_LAYERS}/2-flap-closed.svg`}
                alt=""
                className="absolute inset-0 w-full h-full z-30"
                style={{ transformOrigin: FLAP_ORIGIN }}
                animate={{ scaleY: isOpen ? 0 : 1 }}
                transition={{
                  duration: 0.25,
                  ease: isOpen ? "easeIn" : "easeOut",
                  delay: isOpen ? 0.45 : 0,
                }}
              />

              <div
                className="absolute z-40"
                style={{ left: "36.36%", top: "60.85%", width: "27.27%", aspectRatio: "1" }}
              >
                <motion.img
                  src={`${OPEN_LAYERS}/5-seal-half-a.svg`}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  animate={
                    isOpen
                      ? { x: -26, y: -10, rotate: -16, opacity: 0 }
                      : { x: 0, y: 0, rotate: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.55, ease: [0.3, 0.7, 0.3, 1] }}
                />
                <motion.img
                  src={`${OPEN_LAYERS}/5-seal-half-b.svg`}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  animate={
                    isOpen
                      ? { x: 26, y: 10, rotate: 14, opacity: 0 }
                      : { x: 0, y: 0, rotate: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.55, ease: [0.3, 0.7, 0.3, 1] }}
                />
              </div>
            </motion.div>

            {/* Stamps: hidden inside the envelope, burst out above it (never tucked
                behind) + float independently once open */}
            {connectSocials.map((social, idx) => {
              const key = social.title?.toLowerCase();
              const stampSvg = STAMP_SVGS[key];
              const fx = STAMP_FX[key] || { x: 0, y: 0, rotate: 0, floatDuration: 2.6, floatDelay: 0 };

              if (!stampSvg) return null;

              return (
                <motion.a
                  key={social.id}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.title}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-1/2 w-20 -ml-10 flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:rounded-lg"
                  style={{ top: "44%", marginTop: "-40px", zIndex: isOpen ? 50 : 0 }}
                  animate={
                    isOpen
                      ? { x: fx.x, y: fx.y, rotate: fx.rotate, scale: 1, opacity: 1 }
                      : { x: 0, y: 0, rotate: 0, scale: 0.25, opacity: 0 }
                  }
                  transition={{
                    duration: 0.45,
                    delay: isOpen ? 0.75 + idx * 0.07 : 0,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Inner wrapper: independent continuous bob, decoupled from entrance transform */}
                  <motion.span
                    className="flex flex-col items-center"
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: fx.floatDuration,
                      delay: fx.floatDelay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <img
                      src={stampSvg}
                      alt={social.title}
                      className="w-16 tablet:w-20 h-auto drop-shadow-[0_6px_12px_rgba(31,42,55,0.18)]"
                    />
                    <span className="font-nunito font-bold text-[10px] tablet:text-xs text-[#1f2a37] block mt-1 whitespace-nowrap">
                      {social.title}
                    </span>
                  </motion.span>
                </motion.a>
              );
            })}
          </div>

          <p className="text-center text-xs font-raleway font-medium text-[#8c8275] mt-10">
            {isOpen
              ? lang === "en"
                ? "Pick a stamp to say hello"
                : "Pilih salah satu untuk say hello"
              : lang === "en"
                ? "Hover or tap the envelope to open it"
                : "Arahkan kursor atau ketuk amplop untuk membukanya"}
          </p>
        </div>
      </div>

      {/* Postcard CTA Card: "Need an internal system?" */}
      <div className="relative w-full rounded-2xl bg-[#faf6ee] border-2 border-dashed border-[#dfd3c3] p-6 tablet:p-8 shadow-[0_4px_20px_rgba(31,42,55,0.04)] overflow-hidden">
        {/* Postcard Stamp Accent */}
        <div className="absolute right-6 top-6 hidden tablet:block opacity-70">
          <div className="w-14 h-16 border border-[#2f5d56]/30 bg-white/70 rounded p-1 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-nunito font-bold text-[#2f5d56]">
              PAR AVION
            </span>
            <span className="text-[12px]">✉️</span>
          </div>
        </div>

        <div className="max-w-md">
          <h3 className="font-nunito font-extrabold text-2xl text-[#1f2a37] mb-2">
            {data.footerCta?.title?.[lang] || "Need an internal system?"}
          </h3>
          <p className="font-raleway font-medium text-sm text-[#4b5563] leading-relaxed mb-6">
            {data.footerCta?.description?.[lang] ||
              "From purchase requests to approval flows custom built for your company's workflows. Let's discuss."}
          </p>

          {/* Buttons: Email + FastWork + Projects.co.id */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={emailHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2f5d56] text-white font-raleway font-bold text-sm shadow-md hover:bg-[#244943] hover:shadow-lg transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 4.622v-9.244l4.623 4.622zm1.066 1.066l4.311 4.311 4.312-4.311 4.877 4.877h-18.377l4.877-4.877zm1.066-1.066l4.622-4.623 4.623 4.623-4.623 4.622-4.622-4.622zm7.622-3.557l4.623 4.622v9.244l-4.623-4.622v-9.244z" />
              </svg>
              <span>
                {data.footerCta?.emailButtonLabel?.[lang] || "Email me"}
              </span>
            </a>

            {ctaSocials.map((cta) => (
              <a
                key={cta.id}
                href={cta.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#2f5d56] text-[#2f5d56] font-raleway font-bold text-xs tablet:text-sm hover:bg-[#2f5d56]/10 transition-colors"
              >
                <span>{cta.title}</span>
                <span className="text-xs">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
