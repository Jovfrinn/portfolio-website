import React from "react";
import Head from "next/head";
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
      className="site-root w-full min-h-screen overflow-x-hidden flex flex-col"
      data-scene={scene}
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
      {/* 1. STICKY NAVBAR                                                          */}
      {/* ========================================================================= */}
      <Header />

      {/* ========================================================================= */}
      {/* 2. HERO                                                                   */}
      {/* ========================================================================= */}
      <section id="hero" className="hero-section-wrapper" data-scene={scene}>
        <Hero />
      </section>

      {/* ========================================================================= */}
      {/* 3. PROJECTS SECTION (AOS Animated)                                        */}
      {/* ========================================================================= */}
      <section
        id="projects"
        className="w-full py-20"
        style={{
          backgroundColor: "var(--cream)",
          borderTop: "1px solid var(--band-border)",
        }}
      >
        <div className="content-container">
          {/* Section Heading with AOS */}
          <div
            data-aos="fade-up"
            data-aos-duration="600"
            className="flex flex-col gap-2 mb-12"
          >
            <h2 className="font-nunito font-extrabold text-3xl tablet:text-4xl laptop:text-5xl text-[#1f2a37] tracking-tight">
              {lang === "en" ? "Selected Projects" : "Proyek Pilihan"}
            </h2>
            <p className="font-raleway font-medium text-sm tablet:text-base text-[#4b5563] max-w-2xl">
              {lang === "en"
                ? "A curated selection of systems and applications shipped end-to-end."
                : "Sejumlah sistem dan aplikasi yang dibangun end-to-end dari database hingga tampilan responsif."}
            </p>
          </div>

          {/* Projects Grid with Staggered AOS */}
          <div className="grid grid-cols-1 laptop:grid-cols-2 gap-8">
            {publishedProjects.map((project, idx) => (
              <div
                key={project.id}
                data-aos="fade-up"
                data-aos-delay={(idx % 2) * 100}
                data-aos-duration="600"
                className={project.featured ? "laptop:col-span-2" : ""}
              >
                <ProjectCard
                  project={project}
                  lang={lang}
                  featuredSpan={project.featured}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SERVICES + HOW I WORK (AOS Animated)                                   */}
      {/* ========================================================================= */}
      <section
        id="services"
        className="w-full py-20"
        style={{
          backgroundColor: "var(--band-services)",
          borderTop: "1px solid var(--band-border)",
        }}
      >
        <div className="content-container">
          <div className="grid grid-cols-1 laptop:grid-cols-12 gap-12 laptop:gap-16 items-start">
            {/* Left: Sticky notes Services */}
            <div
              data-aos="fade-up"
              data-aos-duration="600"
              className="laptop:col-span-6"
            >
              <Services />
            </div>

            {/* Right: Spiral Binder How I Work */}
            <div
              data-aos="fade-up"
              data-aos-delay="150"
              data-aos-duration="600"
              className="laptop:col-span-6"
            >
              <HowIWork />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TECH STACK (AOS Animated)                                              */}
      {/* ========================================================================= */}
      <section
        id="tech-stack"
        className="w-full pt-20"
        style={{
          backgroundColor: "var(--band-about)",
          borderTop: "1px solid var(--band-border)",
        }}
      >
        <div
          data-aos="fade-up"
          data-aos-duration="600"
          className="content-container"
        >
          <TechStack />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ABOUT + CONTACT (AOS Animated)                                         */}
      {/* ========================================================================= */}
      <section
        id="about-contact"
        className="w-full pb-20"
        style={{ backgroundColor: "var(--band-about)" }}
      >
        <div className="content-container">
          <div className="grid grid-cols-1 laptop:grid-cols-12 gap-12 laptop:gap-16 items-start">
            {/* Left Column: About Profile Card + Macbook Sticker Showcase */}
            <div
              data-aos="fade-up"
              data-aos-duration="600"
              className="laptop:col-span-6 flex flex-col"
            >
              <About />
              <div
                className="mt-6 pt-6 border-t"
                style={{ borderTopColor: "var(--band-border)" }}
                data-aos="fade-up"
                data-aos-delay="100"
                data-aos-duration="600"
              >
                <MacbookShowcase />
              </div>
            </div>

            {/* Right Column: Contact Envelope + Stamps + Postcard CTA */}
            <div
              data-aos="fade-up"
              data-aos-delay="150"
              data-aos-duration="600"
              className="laptop:col-span-6 flex flex-col"
            >
              <Contact />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}
