import { Popover, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState, Fragment } from "react";
import Button from "../Button";
import data from "../../data/portfolio.json";
import { useLanguage } from "../../context/LanguageContext";

const Header = ({ handleWorkScroll, handleAboutScroll, isBlog }) => {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const { name, showBlog, showResume } = data;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navTranslations = {
    en: {
      project: "Projects",
      about: "About",
      contact: "Contact",
      resume: "Resume",
      home: "Home"
    },
    id: {
      project: "Proyek",
      about: "Tentang",
      contact: "Kontak",
      resume: "Resume",
      home: "Beranda"
    }
  };
  const t = navTranslations[lang] || navTranslations.en;

  const handleContactScroll = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const formatLogo = (logoText) => {
    if (logoText.includes("Joiner")) {
      const [first, second] = logoText.split("Joiner");
      return (
        <span>
          {first}
          <span className="text-brand-400">Joiner</span>
          {second}
        </span>
      );
    }
    return logoText;
  };

  return (
    <>
      {/* Mobile Header (spans full viewport width, content is padded) */}
      <div className="block tablet:hidden w-full bg-[#0a0a0a]/70 sticky top-0 z-30 backdrop-blur-md transition-all border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-6">
          <h1
            onClick={() => router.push("/")}
            className="text-base font-bold font-mono tracking-tight cursor-pointer text-white"
          >
            {formatLogo(name)}
          </h1>

          <div className="flex items-center gap-2.5">
            {mounted && (
              <div className="flex items-center gap-0.5 border border-white/10 rounded-lg p-0.5 font-mono text-[9px] font-bold">
                <button
                  onClick={() => setLang("en")}
                  className={`px-1.5 py-0.5 rounded transition-all duration-200 ${
                    lang === "en"
                      ? "bg-brand-400 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("id")}
                  className={`px-1.5 py-0.5 rounded transition-all duration-200 ${
                    lang === "id"
                      ? "bg-brand-400 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  ID
                </button>
              </div>
            )}

            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
                    aria-label="Toggle Navigation Menu"
                  >
                    <img
                      className="h-5 w-5"
                      src={`/images/${!open ? "menu-white.svg" : "cancel-white.svg"}`}
                      alt="Menu Toggle"
                    />
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 translate-y-1 scale-95"
                    enterTo="opacity-100 translate-y-0 scale-100"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 translate-y-0 scale-100"
                    leaveTo="opacity-0 translate-y-1 scale-95"
                  >
                    <Popover.Panel className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl border border-white/10 bg-[#0a0a0a] p-2 shadow-xl focus:outline-none z-40">
                      <div className="flex flex-col gap-1 font-mono text-sm text-zinc-300">
                        {!isBlog ? (
                          <>
                            <button
                              onClick={() => handleWorkScroll?.()}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {t.project}
                            </button>
                            <button
                              onClick={() => handleAboutScroll?.()}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {t.about}
                            </button>
                            {showBlog && (
                              <button
                                onClick={() => router.push("/blog")}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                              >
                                Blog
                              </button>
                            )}
                            <button
                              onClick={handleContactScroll}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {t.contact}
                            </button>
                            <a
                              href={lang === "id" ? "/images/Resume-(Indonesia).pdf" : "/images/Resume-(English).pdf"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors block"
                            >
                              {t.resume}
                            </a>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => router.push("/")}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {t.home}
                            </button>
                            {showBlog && (
                              <button
                                onClick={() => router.push("/blog")}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                              >
                                Blog
                              </button>
                            )}
                            <button
                              onClick={handleContactScroll}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {t.contact}
                            </button>
                          </>
                        )}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </div>
      </div>

      {/* Desktop Header (spans full viewport width, contents are aligned to container) */}
      <div className="hidden tablet:block w-full bg-[#0a0a0a]/70 sticky top-0 z-30 backdrop-blur-md transition-all border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between h-20 px-6 tablet:px-12 laptop:px-16">
          <h1
            onClick={() => router.push("/")}
            className="text-lg font-bold font-mono tracking-tight cursor-pointer transition-all duration-300 hover:tracking-wide text-white"
          >
            {formatLogo(name)}
          </h1>

          <div className="flex items-center gap-6 font-mono text-sm">
            {!isBlog ? (
              <>
                <button
                  onClick={handleWorkScroll}
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.project}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </button>
                <button
                  onClick={handleAboutScroll}
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.about}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </button>
                {showBlog && (
                  <button
                    onClick={() => router.push("/blog")}
                    className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    Blog
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                  </button>
                )}
                <button
                  onClick={handleContactScroll}
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.contact}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </button>
                <a
                  href={lang === "id" ? "/images/Resume-(Indonesia).pdf" : "/images/Resume-(English).pdf"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.resume}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/")}
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.home}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </button>
                {showBlog && (
                  <button
                    onClick={() => router.push("/blog")}
                    className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    Blog
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                  </button>
                )}
                <button
                  onClick={handleContactScroll}
                  className="relative group pb-1 text-zinc-400 hover:text-brand-400 transition-colors duration-200"
                >
                  {t.contact}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-400 group-hover:w-full transition-all duration-300"></span>
                </button>
              </>
            )}

            {mounted && (
              <div className="flex items-center gap-0.5 border border-white/10 rounded-lg p-0.5 font-mono text-[11px] font-bold">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 rounded transition-all duration-200 ${
                    lang === "en"
                      ? "bg-brand-400 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("id")}
                  className={`px-2 py-1 rounded transition-all duration-200 ${
                    lang === "id"
                      ? "bg-brand-400 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  ID
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
