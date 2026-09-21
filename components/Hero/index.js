"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import KineticGrid from "../ui/kinetic-grid";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const line = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const Hero = ({ handleWorkScroll }) => {
  const { lang } = useLanguage();

  const words =
    data.headerTaglineThreeRotations && data.headerTaglineThreeRotations[lang]
      ? data.headerTaglineThreeRotations[lang]
      : ["systems & websites"];

  const [currentText, setCurrentText] = useState(words[0]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentWordIndex(0);
    setCurrentText(words[0]);
    setIsDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    let timer;

    const tick = () => {
      const fullWord = words[currentWordIndex];
      if (!fullWord) return;

      if (!isDeleting) {
        const nextText = fullWord.substring(0, currentText.length + 1);
        setCurrentText(nextText);

        if (nextText === fullWord) {
          timer = setTimeout(() => setIsDeleting(true), 2000);
          return;
        }
      } else {
        const nextText = fullWord.substring(0, currentText.length - 1);
        setCurrentText(nextText);

        if (nextText === "") {
          setIsDeleting(false);
          setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
          return;
        }
      }
    };

    let delay = 100;
    if (isDeleting) {
      delay = 50;
    } else if (currentText === "") {
      delay = 500;
    }

    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentText, isDeleting, currentWordIndex, words]);

  const highlightWord = words[0];
  const taglineParts = data.headerTaglineThree[lang].split(highlightWord);
  const taglinePrefix = taglineParts[0] || "";
  const taglineSuffix = taglineParts[1] || "";

  const erpStatusesData = {
    en: [
      { name: "Web Application Development", status: "active", completed: true },
      { name: "CRM / CMS Systems", status: "active", completed: true },
      { name: "E-Learning Platform", status: "active", completed: true },
      { name: "E-Commerce Platform", status: "active", completed: true },
      { name: "Mobile Application (React Native)", status: "active", completed: true },
      { name: "ERP System", status: "in progress", completed: false },
      { name: "New project", status: "open", completed: false },
    ],
    id: [
      { name: "Pengembangan Aplikasi Web", status: "aktif", completed: true },
      { name: "Sistem CRM / CMS", status: "aktif", completed: true },
      { name: "Platform E-Learning", status: "aktif", completed: true },
      { name: "Platform E-Commerce", status: "aktif", completed: true },
      { name: "Aplikasi Mobile (React Native)", status: "aktif", completed: true },
      { name: "Sistem ERP", status: "sedang berjalan", completed: false },
      { name: "Proyek baru", status: "terbuka", completed: false },
    ],
  };

  const erpStatuses = erpStatusesData[lang] || erpStatusesData.en;

  return (
    <div
      className="relative overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      {/* min-height, not a fixed height — content is always allowed to
          grow the box naturally instead of being centered/clipped when
          it's taller than one viewport (longer ID copy, small screens). */}
      <KineticGrid className="!min-h-[100svh]" globalColor="default">
        <div className="container mx-auto px-8 tablet:px-16 laptop:px-24 pt-40 tablet:pt-44 pb-24">
          <div className="grid grid-cols-1 laptop:grid-cols-12 gap-12 laptop:gap-8 laptop:items-start">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="laptop:col-span-7"
            >
              <motion.p
                variants={line}
                className="text-xs tablet:text-sm font-mono tracking-wider text-brand-300 uppercase flex items-center gap-2 font-semibold mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-400"></span>
                </span>
                {data.headerTaglineOne[lang]}
              </motion.p>

              <motion.h1
                variants={line}
                className="font-display text-5xl tablet:text-7xl laptop:text-7xl font-black tracking-tight text-white leading-[0.98] mb-4"
              >
                {data.headerTaglineTwo[lang]}
              </motion.h1>

              {/* Fixed-size box for the typewriter line — its word length
                  changes every rotation, so height/width are locked here
                  to the worst-case wrap (up to 3 lines on mobile, 2 on
                  larger screens) so the CTA/status card below never
                  shifts while it types. */}
              <motion.h2
                variants={line}
                className="font-display text-3xl tablet:text-5xl laptop:text-5xl font-black tracking-tight leading-[1.05] mb-10 w-full min-h-[96px] tablet:min-h-[112px]"
              >
                <span className="text-zinc-300">{taglinePrefix}</span>
                <span className="text-brand-400">
                  {currentText}
                  <span className="ml-1 inline-block w-[3px] h-[0.8em] bg-brand-400 align-middle animate-blink"></span>
                </span>
                <span className="text-zinc-300">{taglineSuffix}</span>
              </motion.h2>

              <motion.p
                variants={line}
                className="text-base tablet:text-lg text-zinc-400 max-w-xl leading-relaxed mb-12"
              >
                {data.headerTaglineFour[lang]}
              </motion.p>

              <motion.div variants={line} className="flex flex-wrap items-center gap-5">
                <button
                  onClick={handleWorkScroll}
                  className="text-sm px-6 py-3.5 rounded-full font-mono font-bold flex items-center gap-2 whitespace-nowrap bg-brand-400 text-zinc-950 transition-all duration-200 hover:bg-brand-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(74,158,255,0.7)]"
                >
                  {lang === "en" ? "View projects" : "Lihat proyek"} <span>→</span>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      data.socials.find((s) => s.title === "Email")?.link ||
                        "mailto:jovfrinjoiner01@gmail.com",
                    )
                  }
                  className="text-sm px-6 py-3.5 rounded-full font-mono font-semibold whitespace-nowrap border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                >
                  {lang === "en" ? "Contact me" : "Hubungi saya"}
                </button>
              </motion.div>
            </motion.div>

            {/* Floating status card — sits beside the heading on desktop,
                stacks below the CTAs on mobile/tablet. */}
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: -1.5 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ rotate: 0, scale: 1.01 }}
              className="laptop:col-span-5 laptop:mt-2"
            >
              <div className="w-full border border-white/10 rounded-2xl p-6 bg-white/[0.03] backdrop-blur-sm shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                <div className="relative flex items-center justify-center pb-4 mb-4 border-b border-white/10">
                  <div className="absolute left-0 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-400"></span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 lowercase tracking-wider">
                    ~/dev — status
                  </span>
                </div>
                <div className="space-y-2 font-mono max-h-64 overflow-y-auto">
                  {erpStatuses.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.04] rounded-lg transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.completed ? (
                          <span className="text-brand-400 font-bold">✓</span>
                        ) : (
                          <span className="text-amber-400 text-[9px] animate-pulse">●</span>
                        )}
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          item.completed ? "text-brand-400" : "text-amber-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </KineticGrid>
    </div>
  );
};

export default Hero;
