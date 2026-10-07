import React, { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

export default function Header() {
  const { lang, setLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: data.nav[lang].home, href: "#hero" },
    { label: data.nav[lang].project, href: "#projects" },
    { label: data.nav[lang].about, href: "#about" },
    { label: data.nav[lang].contact, href: "#contact" },
  ];

  const resumeUrl = data.resumeFiles?.[lang] || "/images/Resume-(English).pdf";

  const handleScrollTo = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const targetId = href.replace("#", "");
      if (targetId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(targetId);
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
    <header
      ref={headerRef}
      className="w-full fixed top-0 inset-x-0 z-50 bg-[#f8f3e8]/90 backdrop-blur-md border-b border-[#1f2a37]/10 shadow-[0_2px_16px_rgba(31,42,55,0.06)]"
    >
      <div className="content-container py-6 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => handleScrollTo(e, "#hero")}
          className="font-nunito font-extrabold text-2xl tracking-tight text-[#1f2a37] hover:opacity-85 transition-opacity"
        >
          {data.name}
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden laptop:flex items-center gap-8">
          {navLinks.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              onClick={(e) => handleScrollTo(e, item.href)}
              className="font-raleway font-semibold text-[15px] text-[#1f2a37] opacity-80 hover:opacity-100 hover:text-[#2f5d56] transition-all"
            >
              {item.label}
            </a>
          ))}

          {/* Resume link */}
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-raleway font-semibold text-[15px] text-[#1f2a37] opacity-80 hover:opacity-100 hover:text-[#2f5d56] transition-all"
          >
            {data.nav[lang].resume}
          </a>

          {/* Language Switcher Pill */}
          <div className="flex items-center p-1 rounded-full bg-white border border-[#1f2a37]/15 shadow-[0_1px_6px_rgba(31,42,55,0.08)]">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full text-xs font-raleway font-bold transition-all ${
                lang === "en"
                  ? "bg-[#2f5d56] text-white shadow-sm"
                  : "text-[#1f2a37] opacity-90 hover:opacity-100"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("id")}
              className={`px-3 py-1 rounded-full text-xs font-raleway font-bold transition-all ${
                lang === "id"
                  ? "bg-[#2f5d56] text-white shadow-sm"
                  : "text-[#1f2a37] opacity-90 hover:opacity-100"
              }`}
            >
              ID
            </button>
          </div>
        </nav>

        {/* Mobile controls: Lang pill + hamburger */}
        <div className="flex items-center gap-3 laptop:hidden">
          {/* Mobile Language Switcher */}
          <div className="flex items-center p-1 rounded-full bg-white border border-[#1f2a37]/15 shadow-[0_1px_6px_rgba(31,42,55,0.08)]">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full text-xs font-raleway font-bold transition-all ${
                lang === "en"
                  ? "bg-[#2f5d56] text-white shadow-sm"
                  : "text-[#1f2a37] opacity-90"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("id")}
              className={`px-2.5 py-1 rounded-full text-xs font-raleway font-bold transition-all ${
                lang === "id"
                  ? "bg-[#2f5d56] text-white shadow-sm"
                  : "text-[#1f2a37] opacity-90"
              }`}
            >
              ID
            </button>
          </div>

          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#1f2a37] bg-[#efe7d8] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="laptop:hidden px-6 py-4 bg-[#f8f3e8] border-b border-[#efe7d8] shadow-lg">
          <div className="flex flex-col gap-4">
            {navLinks.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={(e) => handleScrollTo(e, item.href)}
                className="font-raleway font-semibold text-lg text-[#1f2a37] py-1"
              >
                {item.label}
              </a>
            ))}
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-raleway font-semibold text-lg text-[#2f5d56] py-1"
            >
              {data.nav[lang].resume} ↗
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
