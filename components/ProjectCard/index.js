import { useRouter } from "next/router";
import Image from "next/image";

export default function ProjectCard({ project, lang, featuredSpan }) {
  const router = useRouter();
  const href = "/projects/" + project.slug;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
      className={
        "glow-card group w-full rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-4 transition-colors duration-300 hover:border-brand-400/30 overflow-hidden cursor-pointer " +
        (featuredSpan ? "laptop:col-span-2" : "")
      }
    >
        <div className="relative w-full aspect-[16/9] bg-white/[0.03]">
          {project.thumbnailThumb ? (
            <Image
              src={project.thumbnailThumb}
              alt={project.title[lang]}
              layout="fill"
              objectFit="cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
              {project.path || project.title[lang]}
            </div>
          )}
        </div>

        <div className="p-8 pt-0 flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-zinc-500 font-semibold">{project.id}</span>
            {project.path && <span className="font-mono text-xs text-brand-400 font-semibold">{project.path}</span>}
          </div>

          <h4 className="font-display text-xl tablet:text-2xl font-bold text-white tracking-tight">{project.title[lang]}</h4>
          <p className="text-sm tablet:text-base text-zinc-400 leading-relaxed max-w-2xl">{project.description[lang]}</p>

          {project.link && project.link.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {project.link.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-mono inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white hover:border-brand-400/40 hover:scale-[1.03] transition-all duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-1">
            {project.tags.map((tag, idx) => (
              <span key={idx} className="text-xs font-mono px-3 py-1 rounded-lg border border-white/10 text-zinc-400 bg-white/[0.02]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
  );
}
