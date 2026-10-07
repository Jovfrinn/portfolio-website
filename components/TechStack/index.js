import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

// Tech stickers data from references/vectors/index.html
const STICKERS = [
  { name: "react", x: 8, y: 6, h: 80, rot: -6 },
  { name: "laravel", x: 200, y: 0, h: 80, rot: -3 },
  { name: "react-native", x: 340, y: 8, h: 80, rot: 0 },
  { name: "mysql", x: 4, y: 150, h: 80, rot: 3 },
  { name: "apple", x: 210, y: 140, h: 86, rot: 6 },
  { name: "php", x: 330, y: 150, h: 80, rot: -6 },
  { name: "nextjs", x: 14, y: 255, h: 44, rot: -3 },
  { name: "typescript", x: 190, y: 255, h: 44, rot: 0 },
  { name: "git", x: 360, y: 250, h: 80, rot: 3 },
  { name: "postgresql", x: 20, y: 310, h: 80, rot: 6 },
  { name: "docker", x: 200, y: 315, h: 44, rot: -6 },
];

export default function TechStack() {
  const { lang } = useLanguage();

  const title = data.techstack?.title?.[lang] || "Tech Stack";
  const description = data.techstack?.description?.[lang];
  const categories = data.techstack?.categories || [];

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-nunito font-extrabold text-3xl laptop:text-4xl text-[#1f2a37] tracking-tight mb-2">
          {title}
        </h2>
        {description && (
          <p className="font-raleway font-medium text-sm laptop:text-base text-[#4b5563]">
            {description}
          </p>
        )}
      </div>

      {/* Categorized Tech Chips with AOS */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-5 mb-10">
        {categories.map((category, idx) => (
          <div
            key={category.id}
            data-aos="fade-up"
            data-aos-delay={(idx % 2) * 100}
            data-aos-duration="500"
            className="p-5 rounded-2xl bg-white border border-[#e5dac8] shadow-[0_2px_12px_rgba(31,42,55,0.03)]"
          >
            <h3 className="font-nunito font-bold text-base text-[#1f2a37] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2f5d56]" />
              {category.name[lang]}
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {category.items.map((item) => {
                const isMain = item.level === "main";
                return (
                  <motion.span
                    key={item.id}
                    whileHover={{ y: -2 }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-raleway cursor-default transition-all ${
                      isMain
                        ? "bg-[#2f5d56] text-white font-bold shadow-sm"
                        : "bg-[#fdfbf7] text-[#1f2a37] font-semibold border border-[#dfd3c3] hover:border-[#2f5d56]/40"
                    }`}
                  >
                    <span>{item.name}</span>
                    {!isMain && (
                      <span className="text-[10px] opacity-60 font-medium tracking-tight">
                        ({lang === "en" ? "familiar" : "menengah"})
                      </span>
                    )}
                  </motion.span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MacbookShowcase() {
  const { lang } = useLanguage();

  return (
    <div className="w-full">
      <span className="text-xs font-raleway font-semibold text-[#8c8275] block mb-3 text-center">
        {lang === "en"
          ? "Workspace Sticker Collection"
          : "Koleksi Stiker Laptop"}
      </span>

      <div
        data-aos="zoom-in"
        data-aos-duration="600"
        className="relative w-full max-w-[420px] aspect-[580/430] mx-auto select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* Laptop Lid Base */}
        <img
          src="/vectors/macbook/macbook-lid.png"
          alt=""
          className="w-full h-full object-contain filter drop-shadow-md"
        />

        {/* Stickers positioned precisely on top of the lid */}
        {STICKERS.map((stk, idx) => {
          const leftPct = (stk.x / 580) * 100;
          const topPct = (stk.y / 430) * 100;
          const heightPct = (stk.h / 430) * 100;

          return (
            <img
              key={idx}
              src={`/vectors/tech-stickers/${stk.name}.svg`}
              alt=""
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: `${topPct}%`,
                height: `${heightPct}%`,
                width: "auto",
                transform: `rotate(${stk.rot}deg)`,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
