import { useRef } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";
import ProjectCard from "../components/ProjectCard";
import { useLanguage } from "../context/LanguageContext";
import Footer from "../components/Footer";
import Head from "next/head";
import Cursor from "../components/Cursor";

// Local Data
import data from "../data/portfolio.json";

const socialConfig = {
  Github: {
    color:
      "hover:border-slate-800 dark:hover:border-zinc-300 hover:shadow-[0_8px_30px_rgba(31,41,55,0.08)]",
    icon: (
      <svg
        className="w-6 h-6 fill-current text-slate-800 dark:text-zinc-200"
        viewBox="0 0 24 24"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
        />
      </svg>
    ),
  },
  LinkedIn: {
    color:
      "hover:border-blue-500 hover:text-blue-500 hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)]",
    icon: (
      <svg className="w-6 h-6 fill-current text-[#0a66c2]" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  WhatsApp: {
    color:
      "hover:border-emerald-500 hover:text-emerald-500 hover:shadow-[0_8px_30px_rgba(37,211,102,0.08)]",
    icon: (
      <svg className="w-6 h-6 fill-current text-[#25D366]" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.735-3.805l.39.232c1.472.873 3.1 1.334 4.777 1.335 5.534 0 10.038-4.502 10.04-10.04.002-2.684-1.045-5.207-2.951-7.112C17.135 2.705 14.615 1.657 12.01 1.657 6.473 1.657 1.97 6.158 1.968 11.696c0 1.765.467 3.486 1.353 5.011l.243.418L2.57 20.3l3.222-.845zM16.6 13.9c-.25-.125-1.477-.73-1.705-.813-.227-.084-.393-.125-.557.125-.165.25-.637.813-.78 1-.144.187-.288.208-.538.083a7.892 7.892 0 0 1-2.92-1.8 8.71 8.71 0 0 1-2.01-2.5c-.145-.25-.015-.385.11-.51.113-.11.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.02-.438-.063-.125-.557-1.344-.763-1.844-.2-.486-.403-.418-.557-.426-.144-.007-.31-.009-.476-.009a.916.916 0 0 0-.663.308c-.23.25-.875.854-.875 2.083 0 1.23.894 2.417.99 2.55.097.135 1.76 2.688 4.26 3.77 1.15.5 2.052.793 2.76 1.018 1.157.368 2.1.315 2.894.197.88-.13 1.802-.736 2.053-1.42.25-.683.25-1.27.175-1.393-.075-.125-.27-.208-.52-.333z" />
      </svg>
    ),
  },
  Email: {
    color:
      "hover:border-emerald-500 hover:text-emerald-500 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]",
    icon: (
      <svg
        className="w-6 h-6 fill-current text-emerald-500"
        viewBox="0 0 24 24"
      >
        <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 4.622v-9.244l4.623 4.622zm1.066 1.066l4.311 4.311 4.312-4.311 4.877 4.877h-18.377l4.877-4.877zm1.066-1.066l4.622-4.623 4.623 4.623-4.623 4.622-4.622-4.622zm7.622-3.557l4.623 4.622v9.244l-4.623-4.622v-9.244z" />
      </svg>
    ),
  },
};

const defaultSocial = {
  color:
    "hover:border-emerald-500 hover:text-emerald-500 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]",
  icon: (
    <svg className="w-6 h-6 fill-current text-emerald-500" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
};

// Scroll-reveal variants shared across sections below the hero.
const sectionReveal = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const gridReveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const SectionHeading = ({ index, title, description }) => (
  <div className="flex flex-col gap-3 mb-12">
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-brand-400 font-semibold">
        [{index}]
      </span>
      <h3 className="font-display text-2xl tablet:text-3xl font-black tracking-tight text-white">
        {title}
        <span className="text-brand-400">.</span>
      </h3>
    </div>
    {description && (
      <p className="text-sm tablet:text-base text-zinc-400 max-w-xl leading-relaxed">
        {description}
      </p>
    )}
  </div>
);

export default function Home() {
  // Ref
  const workRef = useRef();
  const aboutRef = useRef();

  const { lang } = useLanguage();

  // Handling Scroll
  const handleWorkScroll = () => {
    window.scrollTo({
      top: workRef.current.offsetTop - 80,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleAboutScroll = () => {
    window.scrollTo({
      top: aboutRef.current.offsetTop - 80,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`relative min-h-screen ${data.flags.showCursor && "cursor-none"}`}
    >
      {data.flags.showCursor && <Cursor />}
      <Head>
        <title>{data.seo[lang === "en" ? "titleEn" : "titleId"]}</title>
        <meta name="description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
        <meta name="keywords" content={data.seo.keywords} />
        <meta name="author" content={data.name} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={data.seo.canonicalUrl} />
        {data.seo.faviconUrl && <link rel="icon" href={data.seo.faviconUrl} />}

        <meta property="og:type" content="website" />
        <meta property="og:title" content={data.seo[lang === "en" ? "titleEn" : "titleId"]} />
        <meta property="og:description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
        <meta property="og:url" content={data.seo.canonicalUrl} />
        <meta property="og:site_name" content={data.name} />
        {data.seo.ogImage && <meta property="og:image" content={data.seo.canonicalUrl.replace(/\/$/, "") + data.seo.ogImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.seo[lang === "en" ? "titleEn" : "titleId"]} />
        <meta name="twitter:description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
      </Head>

      {/* Decorative gradient containers remain but are hidden in style/globals.css */}
      <div className="gradient-circle"></div>
      <div className="gradient-circle-bottom"></div>

      <Header
        handleWorkScroll={handleWorkScroll}
        handleAboutScroll={handleAboutScroll}
      />

      <Hero handleWorkScroll={handleWorkScroll} />

      <div className="container mx-auto px-8 tablet:px-16 laptop:px-24 mb-20">
        {/* Projects Section */}
        <motion.div
          id="work"
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          ref={workRef}
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading
            index="01"
            title={lang === "en" ? "Projects" : "Proyek"}
            description={
              lang === "en"
                ? "A selection of systems shipped end-to-end, from database to responsive UI."
                : "Sejumlah sistem yang dibangun end-to-end, dari database sampai tampilan responsif."
            }
          />

          <motion.div className="grid grid-cols-1 laptop:grid-cols-2 gap-6" variants={gridReveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
            {data.projects
              .filter((project) => project.published)
              .sort((a, b) => a.order - b.order)
              .map((project) => (
                <motion.div key={project.id} variants={cardReveal} whileHover={{ y: -4 }}>
                  <ProjectCard project={project} lang={lang} featuredSpan={project.featured} />
                </motion.div>
              ))}
          </motion.div>
        </motion.div>

        {/* Services Section */}
        <motion.div
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading
            index="02"
            title={lang === "en" ? "Services" : "Layanan"}
          />

          <motion.div
            className="grid grid-cols-1 tablet:grid-cols-2 gap-6"
            variants={gridReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {data.services
              .filter((service) => service.published)
              .sort((a, b) => a.order - b.order)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.title[lang]}
                  description={service.description[lang]}
                />
              ))}
          </motion.div>
        </motion.div>

        {/* How I Work Section */}
        <motion.div
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading index="03" title={data.howIWork.title[lang]} description={data.howIWork.description[lang]} />

          <motion.div className="flex flex-col gap-4" variants={gridReveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
            {data.howIWork.steps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((step, idx) => (
                <motion.div
                  key={step.id}
                  variants={cardReveal}
                  className="glow-card w-full p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex gap-5 items-start transition-colors duration-300 hover:border-brand-400/30"
                >
                  <span className="font-mono text-sm text-brand-400 font-semibold shrink-0">{String(idx + 1).padStart(2, "0")}</span>
                  <div>
                    <h4 className="font-display text-lg font-bold text-white tracking-tight mb-1">{step.title[lang]}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{step.description[lang]}</p>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        </motion.div>

        {/* About Section */}
        <motion.div
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          ref={aboutRef}
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading
            index="04"
            title={lang === "en" ? "About Me" : "Tentang Saya"}
          />
          <p className="text-base tablet:text-lg text-zinc-400 leading-relaxed max-w-3xl">
            {data.aboutpara[lang]}
          </p>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading
            index="05"
            title={data.techstack.title[lang]}
            description={data.techstack.description[lang]}
          />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={gridReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {data.techstack.categories.map((category, idx) => (
              <motion.div
                key={idx}
                variants={cardReveal}
                whileHover={{ y: -4 }}
                className="glow-card p-6 rounded-2xl border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-brand-400/30"
              >
                <h4 className="flex items-center gap-2 text-sm font-semibold font-mono text-zinc-300 mb-4">
                  <span className="text-brand-400">▹</span>
                  {category.name[lang]}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <span
                      key={item.id}
                      className={
                        item.level === "main"
                          ? "text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 bg-white/[0.02] hover:text-white hover:border-brand-400/40 transition-all duration-200 cursor-default hover:scale-[1.03]"
                          : "text-xs font-mono px-3 py-1.5 rounded-lg border border-white/5 text-zinc-600 bg-white/[0.01] cursor-default inline-flex items-center gap-1.5"
                      }
                    >
                      {item.name}
                      {item.level === "familiar" && <span className="text-[9px] uppercase tracking-wide text-zinc-700">Familiar</span>}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Connect Section */}
        <motion.div
          className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <SectionHeading
            index="06"
            title={data.socials_section.title[lang]}
            description={data.socials_section.description[lang]}
          />

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={gridReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {data.socials
              .filter((social) => social.placement === "connect_grid" && social.published)
              .sort((a, b) => a.order - b.order)
              .map((social) => {
                const config = socialConfig[social.title] || defaultSocial;
                return (
                  <motion.a
                    key={social.id}
                    variants={cardReveal}
                    whileHover={{ y: -4 }}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glow-card p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-3 transition-colors duration-300 hover:border-brand-400/30"
                  >
                    <div className="text-zinc-400">{config.icon}</div>
                    <span className="font-mono text-sm font-semibold text-zinc-200">
                      {social.title}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {social[lang === "en" ? "actionEn" : "actionId"]}
                    </span>
                  </motion.a>
                );
              })}
          </motion.div>
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}
