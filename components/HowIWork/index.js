import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

export default function HowIWork() {
  const { lang } = useLanguage();

  const title =
    data.howIWork?.title?.[lang] ||
    (lang === "en" ? "How I Work" : "Cara Saya Bekerja");
  const description = data.howIWork?.description?.[lang];
  const steps = [...(data.howIWork?.steps || [])].sort(
    (a, b) => a.order - b.order
  );

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
      <div className="relative w-full rounded-2xl bg-[#faf6ee] border border-[#dfd3c3] shadow-[0_8px_30px_rgba(31,42,55,0.07)] p-6 tablet:p-8 overflow-hidden">
        {/* Binder spiral rings decoration on left margin */}
        <div className="absolute left-3 top-4 bottom-4 flex flex-col justify-between items-center w-6 pointer-events-none opacity-40">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3 rounded-full border-2 border-[#8c8275] bg-[#dfd3c3]"
            />
          ))}
        </div>

        {/* Notebook Ruled lines & Red margin line */}
        <div className="pl-6 tablet:pl-10">
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={step.id || idx}
                data-aos="fade-left"
                data-aos-delay={idx * 60}
                data-aos-duration="450"
                className="group flex items-start gap-3.5 py-2 border-b border-[#ebdccb]/60 last:border-b-0 transition-colors"
              >
                {/* Handwritten style Checkbox */}
                <div className="mt-0.5 shrink-0">
                  <img
                    src="/vectors/notebook/checkbox.svg"
                    alt="Done"
                    className="w-5 h-5 opacity-90 group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Step content */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-kalam font-bold text-lg text-[#1f2a37]">
                      {step.title[lang]}
                    </span>
                  </div>
                  {step.description?.[lang] && (
                    <span className="font-raleway font-medium text-xs tablet:text-sm text-[#5d6874] mt-0.5">
                      {step.description[lang]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
