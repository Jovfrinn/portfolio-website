import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import data from "../../data/portfolio.json";

export default function About() {
  const { lang } = useLanguage();
  const [profileImgError, setProfileImgError] = useState(false);
  const [unpamLogoError, setUnpamLogoError] = useState(false);
  const [univerzLogoError, setUniverzLogoError] = useState(false);

  const educationText =
    lang === "en"
      ? "Information Systems, Pamulang University"
      : "Sistem Informasi, Universitas Pamulang";

  const workText =
    lang === "en"
      ? "Full-Stack Developer at PT Univerz Teknologi Utama"
      : "Full-Stack Developer di PT Univerz Teknologi Utama";

  return (
    <div id="about" className="w-full flex flex-col">
      {/* Section Header */}
      <div className="mb-5">
        <h2 className="font-nunito font-extrabold text-3xl laptop:text-4xl text-[#1f2a37] tracking-tight mb-2">
          {lang === "en" ? "About Me" : "Tentang Saya"}
        </h2>
      </div>

      {/* Main Profile Card */}
      <div
        data-aos="fade-up"
        data-aos-duration="550"
        className="rounded-2xl bg-white border border-[#e5dac8] p-5 tablet:p-6 shadow-[0_4px_24px_rgba(31,42,55,0.05)] mb-5"
      >
        <div className="flex flex-col tablet:flex-row items-center tablet:items-start gap-4">
          {/* Profile Photo */}
          <div className="relative w-20 h-20 tablet:w-24 tablet:h-24 rounded-xl overflow-hidden shrink-0 bg-[#efe7d8] border-2 border-[#dfd3c3] shadow-inner">
            {!profileImgError ? (
              <img
                src="/portfolio/profile.jpg"
                alt={data.name}
                className="w-full h-full object-cover"
                onError={() => setProfileImgError(true)}
              />
            ) : (
              /* Fallback cozy profile placeholder */
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#efe7d8] text-[#2f5d56]">
                <svg
                  className="w-10 h-10 opacity-80"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col text-center tablet:text-left">
            <h3 className="font-nunito font-extrabold text-xl text-[#1f2a37] mb-0.5">
              {data.name}
            </h3>
            <span className="font-raleway font-semibold text-[#2f5d56] text-sm mb-3">
              Full-Stack Developer
            </span>

            {/* Education & Career Badges */}
            <div className="flex flex-col gap-2.5">
              {/* Education */}
              <div className="flex items-center gap-3 text-sm text-[#4b5563] justify-center tablet:justify-start">
                <div className="w-6 h-6 rounded-md bg-[#efe7d8] flex items-center justify-center shrink-0 overflow-hidden">
                  {!unpamLogoError ? (
                    <img
                      src="/portfolio/unpam-logo.png"
                      alt="UNPAM"
                      className="w-full h-full object-contain"
                      onError={() => setUnpamLogoError(true)}
                    />
                  ) : (
                    <span className="text-xs font-bold text-[#2f5d56]">🎓</span>
                  )}
                </div>
                <span className="font-raleway font-medium">
                  {educationText}
                </span>
              </div>

              {/* Work */}
              <div className="flex items-center gap-3 text-sm text-[#4b5563] justify-center tablet:justify-start">
                <div className="w-6 h-6 rounded-md bg-[#efe7d8] flex items-center justify-center shrink-0 overflow-hidden">
                  {!univerzLogoError ? (
                    <img
                      src="/portfolio/univerz-logo.png"
                      alt="Univerz"
                      className="w-full h-full object-contain"
                      onError={() => setUniverzLogoError(true)}
                    />
                  ) : (
                    <span className="text-xs font-bold text-[#2f5d56]">💼</span>
                  )}
                </div>
                <span className="font-raleway font-medium">{workText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Paragraph */}
      <p
        data-aos="fade-up"
        data-aos-delay="100"
        data-aos-duration="550"
        className="font-raleway font-medium text-sm tablet:text-[15px] text-[#4b5563] leading-relaxed bg-[#faf6ee] p-5 rounded-xl border border-[#ebdccb]"
      >
        {data.aboutpara[lang]}
      </p>
    </div>
  );
}
