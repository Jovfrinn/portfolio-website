import React from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ProjectCard from "../components/ProjectCard";
import Services from "../components/Services";
import HowIWork from "../components/HowIWork";
import About from "../components/About";
import TechStack, { MacbookShowcase } from "../components/TechStack";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { useWeather } from "../context/WeatherContext";
import data from "../data/portfolio.json";

// Motion reveal variants
const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Home() {
  const { lang } = useLanguage();
  const { scene } = useWeather();

  const publishedProjects = (data.projects || [])
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);

  const pageTitle = lang === "en" ? data.seo?.titleEn : data.seo?.titleId;
  const pageDescription =
    lang === "en" ? data.seo?.descriptionEn : data.seo?.descriptionId;
  const canonicalUrl = data.seo?.canonicalUrl || "https://jovfrin.dev";

  return (
    <div
      className="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#f1e4d0] text-[#1f2a37]"
      style={{ paddingTop: "var(--header-h, 84px)" }}
    >
      <Head>
        <title>{pageTitle || data.name}</title>
        <meta name="description" content={pageDescription} />
        {data.seo?.keywords && (
          <meta name="keywords" content={data.seo.keywords} />
        )}
        <meta name="author" content={data.name} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        {data.seo?.faviconUrl && <link rel="icon" href={data.seo.faviconUrl} />}

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={data.name} />
        {data.seo?.ogImage && (
          <meta
            property="og:image"
            content={canonicalUrl.replace(/\/$/, "") + data.seo.ogImage}
          />
        )}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>

      {/* ========================================================================= */}
      {/* 1. STICKY NAVBAR (Always-visible surface, independent of scene color)     */}
      {/* ========================================================================= */}
      <Header />

      {/* ========================================================================= */}
      {/* 2. HERO (Full-Bleed, Dynamic Scene Color Palette)                         */}
      {/* ========================================================================= */}
      <section id="hero" className="hero-section-wrapper" data-scene={scene}>
        <Hero />
      </section>

      {/* ========================================================================= */}
      {/* 2. PROJECTS SECTION (Full-Bleed Band: #f8f3e8)                             */}
      {/* ========================================================================= */}
      <section
        id="projects"
        className="w-full bg-[#f8f3e8] py-20 border-t border-[#ebdccb]"
      >
        <motion.div
          className="content-container"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Section Heading */}
          <div className="flex flex-col gap-2 mb-12">
            <h2 className="font-nunito font-extrabold text-3xl tablet:text-4xl laptop:text-5xl text-[#1f2a37] tracking-tight">
              {lang === "en" ? "Selected Projects" : "Proyek Pilihan"}
            </h2>
            <p className="font-raleway font-medium text-sm tablet:text-base text-[#4b5563] max-w-2xl">
              {lang === "en"
                ? "A curated selection of systems and applications shipped end-to-end."
                : "Sejumlah sistem dan aplikasi yang dibangun end-to-end dari database hingga tampilan responsif."}
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 laptop:grid-cols-2 gap-8">
            {publishedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                lang={lang}
                featuredSpan={project.featured}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICES + HOW I WORK (Full-Bleed Band: #f3e9db, 2 Columns)             */}
      {/* ========================================================================= */}
      <section
        id="services"
        className="w-full bg-[#f3e9db] py-20 border-t border-[#dfd3c3]"
      >
        <motion.div
          className="content-container"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="grid grid-cols-1 laptop:grid-cols-12 gap-12 laptop:gap-16 items-start">
            {/* Left: Sticky notes Services */}
            <div className="laptop:col-span-6">
              <Services />
            </div>

            {/* Right: Spiral Binder How I Work */}
            <div className="laptop:col-span-6">
              <HowIWork />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TECH STACK (Full-Bleed Band: #fcf9f3, Full Width)                       */}
      {/* ========================================================================= */}
      <section
        id="tech-stack"
        className="w-full bg-[#fcf9f3] pt-20 border-t border-[#ebdccb]"
      >
        <motion.div
          className="content-container"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
        >
          <TechStack />
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ABOUT + CONTACT (Full-Bleed Band: #fcf9f3, 2 Columns)                   */}
      {/* ========================================================================= */}
      <section
        id="about-contact"
        className="w-full bg-[#fcf9f3] pb-20"
      >
        <motion.div
          className="content-container"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
        >
          <div className="grid grid-cols-1 laptop:grid-cols-12 gap-12 laptop:gap-16 items-start">
            {/* Left Column: About Profile Card + Macbook Sticker Showcase */}
            <div className="laptop:col-span-6 flex flex-col">
              <About />
              <div className="mt-6 pt-6 border-t border-[#ebdccb]">
                <MacbookShowcase />
              </div>
            </div>

            {/* Right Column: Contact Envelope + Stamps + Postcard CTA */}
            <div className="laptop:col-span-6 flex flex-col">
              <Contact />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER (Full-Bleed, Live Time & Open-Meteo Weather)                    */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}
