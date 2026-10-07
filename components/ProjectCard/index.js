import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ProjectCard({ project, lang, featuredSpan }) {
  const router = useRouter();
  const href = `/projects/${project.slug}`;

  const handleCardClick = () => {
    router.push(href);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#ffffff] border border-[#e5dac8] p-6 tablet:p-8 shadow-[0_4px_24px_rgba(31,42,55,0.05)] hover:shadow-[0_12px_32px_rgba(31,42,55,0.1)] hover:border-[#2f5d56]/30 transition-all duration-300 cursor-pointer ${
        featuredSpan ? "laptop:col-span-2" : ""
      }`}
    >
      <div>
        {/* Top Header info: Featured badge & ID/Path */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#2f5d56]/10 text-[#2f5d56] text-xs font-raleway font-bold">
                ★ {lang === "en" ? "Featured Project" : "Proyek Unggulan"}
              </span>
            )}
          </div>
          {project.path && (
            <span className="text-xs font-semibold text-[#8c8275] tracking-wide">
              {project.path}
            </span>
          )}
        </div>

        {/* Thumbnail if available */}
        {project.thumbnailThumb && (
          <div className="relative w-full aspect-[16/9] mb-5 rounded-xl overflow-hidden bg-[#efe7d8]/40 border border-[#e5dac8]/60">
            <Image
              src={project.thumbnailThumb}
              alt={project.title[lang]}
              layout="fill"
              objectFit="cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}

        {/* Project Title */}
        <h3 className="font-nunito font-extrabold text-xl tablet:text-2xl text-[#1f2a37] mb-3 group-hover:text-[#2f5d56] transition-colors">
          {project.title[lang]}
        </h3>

        {/* Project Description */}
        <p className="font-raleway font-medium text-sm tablet:text-[15px] text-[#4b5563] leading-relaxed mb-6">
          {project.description[lang]}
        </p>
      </div>

      <div>
        {/* Technology tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags?.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs font-raleway font-semibold px-3 py-1 rounded-full bg-[#efe7d8] text-[#1f2a37] border border-[#e2d6c3]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Link Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#f0e7db]">
          {project.link && project.link.length > 0 ? (
            project.link.map((item, idx) => {
              const isPrimary =
                item.label?.toLowerCase() === "live" || idx === 0;
              return (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-raleway font-bold transition-all ${
                    isPrimary
                      ? "bg-[#2f5d56] text-white hover:bg-[#244943] shadow-sm"
                      : "border border-[#2f5d56] text-[#2f5d56] hover:bg-[#2f5d56]/10"
                  }`}
                >
                  <span>{item.label}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              );
            })
          ) : (
            <span className="text-xs font-raleway font-bold text-[#2f5d56] group-hover:underline inline-flex items-center gap-1">
              {lang === "en" ? "View Details" : "Lihat Detail"} →
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
