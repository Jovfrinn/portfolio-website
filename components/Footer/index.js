"use client";

import React from "react";
import { motion } from "framer-motion";
import data from "../../data/portfolio.json";
import { useLanguage } from "../../context/LanguageContext";

const Footer = ({}) => {
  const { lang } = useLanguage();

  const translations = {
    en: {
      title: "Need an internal system?",
      description: "From purchase requests to approval flows custom built for your company's workflows. Let's discuss.",
      emailBtn: "Email me"
    },
    id: {
      title: "Punya kebutuhan sistem internal?",
      description: "Dari purchase request sampai approval flow — bisa dibangun custom sesuai alur kerja perusahaan kamu. Yuk diskusi.",
      emailBtn: "Email saya"
    }
  };

  const t = translations[lang] || translations.en;

  return (
    <div className="mt-32 tablet:mt-40">
      {/* Centered CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glow-card w-full p-10 md:p-20 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-5 hover:border-brand-400/30 transition-colors duration-300"
      >
        <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
          {t.title}
        </h2>
        <p className="text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed">
          {t.description}
        </p>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          <button
            onClick={() =>
              window.open(
                data.socials.find((s) => s.title === "Email")?.link ||
                  "mailto:jovfrinjoiner01@gmail.com"
              )
            }
            className="text-sm px-6 py-3.5 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 transition-all duration-200 hover:bg-brand-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(74,158,255,0.7)]"
          >
            {t.emailBtn}
          </button>

          <button
            onClick={() => window.open("https://fastwork.id/user/jovfrinn")}
            className="text-sm px-6 py-3.5 rounded-full font-mono font-semibold border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            FastWork
          </button>

          <button
            onClick={() => window.open("https://projects.co.id/public/browse_users/view/f8f26b/jovfrinnn")}
            className="text-sm px-6 py-3.5 rounded-full font-mono font-semibold border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Projects.co.id
          </button>
        </div>
      </motion.div>

      {/* Mini Copyright Footer block */}
      <div className="mt-16 pt-8 border-t border-white/10 flex flex-col tablet:flex-row items-center justify-center gap-4 font-mono text-xs text-zinc-500">
        <span>© {new Date().getFullYear()} Jovfrin Joiner</span>
      </div>
    </div>
  );
};

export default Footer;
