import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

// Positions baked into binder.svg (viewBox 520x330, see its <desc>):
// 7 ruled lines centered at y = 60 + 36*i, red margin at x=160, checkbox at x~178.
const ROW_Y_PCT = [60, 96, 132, 168, 204, 240, 276].map((y) => (y / 330) * 100);
const ROW_LEFT_PCT = (178 / 520) * 100;
const ROW_RIGHT_PCT = 100 - (506 / 520) * 100;

export default function HowIWork() {
  const { lang } = useLanguage();

  const title =
    data.howIWork?.title?.[lang] ||
    (lang === "en" ? "How I Work" : "Cara Saya Bekerja");
  const description = data.howIWork?.description?.[lang];
  const steps = [...(data.howIWork?.steps || [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, ROW_Y_PCT.length);

  return (
    <div className="w-full flex flex-col">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="font-nunito font-extrabold text-3xl laptop:text-4xl text-[#1f2a37] tracking-tight mb-2">
          {title}
        </h2>
        {description && (
          <p className="font-raleway font-medium text-sm laptop:text-base text-[#4b5563]">
            {description}
          </p>
        )}
      </div>

      {/* Spiral Binder Notebook */}
      <div className="relative w-full max-w-[760px] aspect-[520/330] mx-auto select-none">
        <img
          src="/vectors/notebook/binder.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full filter drop-shadow-[0_10px_24px_rgba(31,42,55,0.14)]"
        />

        {steps.map((step, idx) => (
          <div
            key={step.id || idx}
            className="group absolute flex items-center gap-2 tablet:gap-3"
            style={{
              left: `${ROW_LEFT_PCT}%`,
              right: `${ROW_RIGHT_PCT}%`,
              top: `${ROW_Y_PCT[idx]}%`,
              transform: "translateY(-50%)",
            }}
          >
            <img
              src="/vectors/notebook/checkbox.svg"
              alt="Done"
              className="w-4 h-4 tablet:w-5 tablet:h-5 shrink-0 opacity-90 group-hover:scale-110 transition-transform"
            />
            <span className="font-kalam font-bold text-sm tablet:text-lg text-[#1f2a37] truncate">
              {step.title[lang]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
