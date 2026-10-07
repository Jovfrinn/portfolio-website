import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useHeroReveal } from "./useHeroReveal";
import HeroSkeleton from "./HeroSkeleton";
import HeroTextSkeleton from "./HeroTextSkeleton";
import data from "../../data/portfolio.json";

const A = "/hero";
const jendela = `${A}/jendela.svg`;
const pagi = `${A}/pagi.svg`;
const siang = `${A}/siang.svg`;
const sore = `${A}/sore.svg`;
const malam = `${A}/malam.svg`;
const hujan = `${A}/hujan.svg`;

const sprite = (part, key) => `${A}/${part}-${key}.webp`;

const SCENES = [
  { key: "pagi", label: "Pagi", src: pagi, line: "228,187,155", steam: "255,255,255,.62" },
  { key: "siang", label: "Siang", src: siang, line: "175,199,215", steam: "255,255,255,.68" },
  { key: "sore", label: "Sore", src: sore, line: "175,117,86", steam: "255,236,205,.62" },
  { key: "malam", label: "Malam", src: malam, line: "170,179,218", steam: "205,215,255,.5" },
  { key: "hujan", label: "Hujan", src: hujan, line: "170,181,186", steam: "235,240,245,.55" },
];

const SCREEN_POLY =
  "363,273 561,268 565,296 566,315 557,326 546,348 546,357 551,358 549,367 544,377 533,378 525,397 376,405";

const CODE_BARS = [
  [451, 297, 44, 8],
  [394, 311, 102, 10],
  [429, 324, 68, 10],
  [398, 345, 99, 11],
  [438, 357, 59, 10],
  [457, 371, 40, 8],
  [523, 292, 31, 7],
  [523, 305, 32, 8],
  [527, 319, 29, 7],
  [529, 339, 19, 7],
  [538, 330, 10, 4],
];

const STEAM = [
  { x: -9, d: "0s", t: "5.6s" },
  { x: 0, d: "-1.9s", t: "6.2s" },
  { x: 9, d: "-3.7s", t: "5.2s" },
];

// Text content renders immediately (it's just JSON), but its entrance
// animates in sync with illustration layers 1-2, staggered top to bottom.
function textRevealProps(reducedMotion, ready, index) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: ready ? 1 : 0 },
      transition: { duration: 0.2, ease: "easeOut" },
    };
  }
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: ready ? 1 : 0, y: ready ? 0 : 14 },
    transition: { duration: 0.5, delay: index * 0.12, ease: "easeOut" },
  };
}

function Person({ scene }) {
  return (
    <div
      key={scene.key}
      className="hero-person"
      style={{ "--line": `rgb(${scene.line})`, "--steam": `rgba(${scene.steam})` }}
    >
      <img className="hp-layer" src={sprite("body", scene.key)} alt="Developer sedang coding" />
      <img className="hp-layer hp-head" src={sprite("head", scene.key)} alt="" />
      <img className="hp-layer hp-hand" src={sprite("hand", scene.key)} alt="" />

      <svg className="hp-layer hp-fx" viewBox="0 0 1076 664" aria-hidden="true">
        <defs>
          <clipPath id="hp-screen">
            <polygon points={SCREEN_POLY} />
          </clipPath>
          <filter id="hp-blur" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        <g clipPath="url(#hp-screen)">
          {CODE_BARS.map(([x, y, w, h], i) => (
            <rect
              key={i}
              className="hp-line"
              x={x}
              y={y}
              width={w}
              height={h}
              rx={h / 2}
              style={{ "--i": i }}
            />
          ))}
        </g>

        <g transform="translate(297 428)" filter="url(#hp-blur)">
          {STEAM.map((s, i) => (
            <g key={i} transform={`translate(${s.x} 0)`}>
              <g className="hp-steam" style={{ "--d": s.d, "--t": s.t }}>
                <path className="hp-wisp" d="M0 0C-7-9 7-17 0-27S-6-44 1-54" />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function Hero() {
  const { lang } = useLanguage();
  const { ready, scene: activeSceneKey, reducedMotion } = useHeroReveal();
  const current = SCENES.find((s) => s.key === activeSceneKey) || SCENES[1];

  // Rotating tagline text state
  const rotations = data.headerTaglineThreeRotations?.[lang] || [
    "systems & websites",
    "CRM & CMS",
    "ERP systems",
  ];
  const [rotationIndex, setRotationIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % rotations.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [rotations.length]);

  const availabilityText = data.headerTaglineOne?.[lang];
  const heroTitle = data.headerTaglineTwo?.[lang] || "Full-Stack Developer.";
  const heroSubtitle = data.headerTaglineFour?.[lang];

  // Split title if it contains line break or render neatly
  const titleParts = heroTitle.split(" ");
  const firstWord = titleParts.length > 1 ? titleParts[0] : heroTitle;
  const restWords = titleParts.length > 1 ? titleParts.slice(1).join(" ") : "";

  const handleHeroBtnClick = (e, href) => {
    if (href?.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      // Map #work to #projects if needed
      const actualId = targetId === "work" ? "projects" : targetId;
      const el = document.getElementById(actualId) || document.getElementById(targetId);
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="w-full flex items-center">
      <div className="hero-wrap">
        <div className="hero-grid grid grid-cols-1 laptop:grid-cols-12 items-center gap-8 laptop:gap-4">
          {/* Left Text Column */}
          <div className="hero-text-col laptop:col-span-5 flex flex-col items-start pr-4 laptop:pr-0">
            <AnimatePresence>
              {!ready && (
                <HeroTextSkeleton key="hero-text-skeleton" reducedMotion={reducedMotion} />
              )}
            </AnimatePresence>

            {ready && (
            <>
            {availabilityText && (
              <motion.div className="hero-badge" {...textRevealProps(reducedMotion, ready, 0)}>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="10" />
                  <path
                    d="M5.5 10.3l3 3 6-6.3"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{availabilityText}</span>
              </motion.div>
            )}

            <motion.h1 className="hero-title" {...textRevealProps(reducedMotion, ready, 1)}>
              {firstWord}
              {restWords && (
                <>
                  <br />
                  {restWords}
                </>
              )}
            </motion.h1>

            {/* Main Subtitle with Rotating Keyword */}
            <motion.div
              className="hero-sub-main flex flex-wrap items-baseline gap-x-2"
              {...textRevealProps(reducedMotion, ready, 2)}
            >
              <span>
                {lang === "en" ? "Building" : "Bikin"}
              </span>
              <span className="relative inline-block min-w-[21ch] h-[1.3em] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={rotations[rotationIndex] + lang}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="inline-block font-extrabold text-[var(--teal-text)]"
                  >
                    {rotations[rotationIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span>
                {lang === "en" ? "that actually get used." : "yang beneran kepake."}
              </span>
            </motion.div>

            {/* Description Subtitle */}
            {heroSubtitle && (
              <motion.p className="hero-sub-desc" {...textRevealProps(reducedMotion, ready, 3)}>
                {heroSubtitle}
              </motion.p>
            )}

            {/* Buttons */}
            <motion.div
              className="hero-btn-row flex flex-wrap items-center gap-4"
              {...textRevealProps(reducedMotion, ready, 4)}
            >
              {data.heroButtons && data.heroButtons.length > 0 ? (
                data.heroButtons.map((btn, idx) => {
                  const label = lang === "en" ? btn.labelEn : btn.labelId;
                  const isPrimary = idx === 0;
                  return (
                    <a
                      key={btn.id || idx}
                      href={btn.href}
                      onClick={(e) => handleHeroBtnClick(e, btn.href)}
                      className={`hero-btn ${
                        isPrimary ? "hero-btn-primary" : "hero-btn-outline"
                      }`}
                    >
                      {label}
                    </a>
                  );
                })
              ) : (
                <>
                  <a
                    href="#projects"
                    onClick={(e) => handleHeroBtnClick(e, "#projects")}
                    className="hero-btn hero-btn-primary"
                  >
                    {lang === "en" ? "View projects" : "Lihat proyek"}
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleHeroBtnClick(e, "#contact")}
                    className="hero-btn hero-btn-outline"
                  >
                    {lang === "en" ? "Contact me" : "Hubungi saya"}
                  </a>
                </>
              )}
            </motion.div>
            </>
            )}
          </div>

          {/* Right Illustration Column */}
          <div className="hero-illustration-col laptop:col-span-7 flex justify-end">
            <div className="hero-stage" aria-busy={!ready}>
              <AnimatePresence>
                {!ready && <HeroSkeleton key="hero-skeleton" reducedMotion={reducedMotion} />}
              </AnimatePresence>

              {ready && activeSceneKey && (
                <>
                  <div className="hero-window">
                    <img
                      key={current.key}
                      className="hero-scene"
                      src={current.src}
                      alt={`Pemandangan ${current.label}`}
                    />
                    <img className="hero-frame" src={jendela} alt="" />
                  </div>
                  <Person scene={current} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
