import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Lightbox from "../../components/Lightbox";
import { useLanguage } from "../../context/LanguageContext";
import { getPublishedProjects, findProjectBySlug, getAdjacentProjects } from "../../utils/projects";
import data from "../../data/portfolio.json";

export async function getStaticPaths() {
  const paths = getPublishedProjects(data).map((project) => ({ params: { slug: project.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const project = findProjectBySlug(data, params.slug);
  if (!project) {
    return { notFound: true };
  }
  const adjacent = getAdjacentProjects(data, params.slug);
  return { props: { project, adjacent } };
}

export default function ProjectDetailPage({ project, adjacent }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const galleryForLightbox = project.gallery
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((image) => ({ src: image.src, captionEn: image.captionEn, captionId: image.captionId }));

  const siteUrl = data.seo.canonicalUrl.replace(/\/$/, "");
  // Falls back to the site-wide default OG image (Settings, Task 32) when this project
  // has no thumbnail of its own yet - a social share of a not-fully-filled-in project
  // should never end up with no preview image at all.
  const ogImagePath = project.thumbnail || data.seo.ogImage;

  return (
    <div className="relative min-h-screen">
      <Head>
        <title>{project.title[lang]} | {data.name}</title>
        <meta name="description" content={project.description[lang]} />
        <link rel="canonical" href={siteUrl + "/projects/" + project.slug} />
        {data.seo.faviconUrl && <link rel="icon" href={data.seo.faviconUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={project.title[lang]} />
        <meta property="og:description" content={project.description[lang]} />
        <meta property="og:url" content={siteUrl + "/projects/" + project.slug} />
        {ogImagePath && <meta property="og:image" content={siteUrl + ogImagePath} />}
      </Head>

      <Header />

      <div className="container mx-auto px-8 tablet:px-16 laptop:px-24 pt-32 pb-24">
        <button onClick={() => router.push("/#work")} type="button" className="text-sm font-mono text-zinc-400 hover:text-brand-400 mb-8">
          ← {lang === "en" ? "Back to Projects" : "Kembali ke Proyek"}
        </button>

        <h1 className="font-display text-4xl tablet:text-5xl font-black text-white tracking-tight mb-4">{project.title[lang]}</h1>
        <p className="text-base tablet:text-lg text-zinc-400 leading-relaxed max-w-3xl mb-10">{project.description[lang]}</p>

        {project.gallery.length > 0 && (
          <div className="grid grid-cols-2 tablet:grid-cols-3 gap-4 mb-12">
            {project.gallery
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((image, idx) => (
                <button
                  key={image.id}
                  onClick={() => setLightboxIndex(idx)}
                  type="button"
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10"
                >
                  <Image
                    src={image.thumbSrc}
                    alt={image[lang === "en" ? "captionEn" : "captionId"] || ""}
                    layout="fill"
                    objectFit="cover"
                    loading="lazy"
                    sizes="33vw"
                  />
                </button>
              ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <Lightbox images={galleryForLightbox} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}

        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-10 mb-12">
          <div>
            <h3 className="font-mono text-xs text-brand-400 uppercase mb-2">{lang === "en" ? "Role" : "Peran"}</h3>
            <p className="text-zinc-300">{project.role[lang]}</p>
          </div>
          <div>
            <h3 className="font-mono text-xs text-brand-400 uppercase mb-2">{lang === "en" ? "Duration" : "Durasi"}</h3>
            <p className="text-zinc-300">{project.duration}</p>
          </div>
          {project.problem[lang] && (
            <div>
              <h3 className="font-mono text-xs text-brand-400 uppercase mb-2">Problem</h3>
              <p className="text-zinc-300">{project.problem[lang]}</p>
            </div>
          )}
          {project.solution[lang] && (
            <div>
              <h3 className="font-mono text-xs text-brand-400 uppercase mb-2">Solution</h3>
              <p className="text-zinc-300">{project.solution[lang]}</p>
            </div>
          )}
        </div>

        {project.features[lang].length > 0 && (
          <div className="mb-12">
            <h3 className="font-mono text-xs text-brand-400 uppercase mb-3">{lang === "en" ? "Key Features" : "Fitur Utama"}</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {project.features[lang].map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {project.impact[lang].length > 0 && (
          <div className="mb-12">
            <h3 className="font-mono text-xs text-brand-400 uppercase mb-3">Impact</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {project.impact[lang].map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-12">
          {project.tags.map((tag, idx) => (
            <span key={idx} className="text-xs font-mono px-3 py-1 rounded-lg border border-white/10 text-zinc-400 bg-white/[0.02]">
              {tag}
            </span>
          ))}
        </div>

        {project.link.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-16">
            {project.link.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-5 py-2.5 rounded-full font-mono font-semibold border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-8">
          {adjacent.prev ? (
            <a href={"/projects/" + adjacent.prev.slug} className="text-sm font-mono text-zinc-400 hover:text-brand-400">
              ← {adjacent.prev.title[lang]}
            </a>
          ) : (
            <span />
          )}
          {adjacent.next && (
            <a href={"/projects/" + adjacent.next.slug} className="text-sm font-mono text-zinc-400 hover:text-brand-400">
              {adjacent.next.title[lang]} →
            </a>
          )}
        </div>
      </div>

      <div className="container mx-auto px-8 tablet:px-16 laptop:px-24">
        <Footer />
      </div>
    </div>
  );
}
