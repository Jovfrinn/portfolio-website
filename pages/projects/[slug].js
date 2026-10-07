import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Lightbox from "../../components/Lightbox";
import { useLanguage } from "../../context/LanguageContext";
import {
  getPublishedProjects,
  findProjectBySlug,
  getAdjacentProjects,
} from "../../utils/projects";
import data from "../../data/portfolio.json";

export async function getStaticPaths() {
  const paths = getPublishedProjects(data).map((project) => ({
    params: { slug: project.slug },
  }));
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

  const galleryForLightbox = (project.gallery || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((image) => ({
      src: image.src,
      captionEn: image.captionEn,
      captionId: image.captionId,
    }));

  const siteUrl =
    data.seo?.canonicalUrl?.replace(/\/$/, "") || "https://jovfrin.dev";
  const ogImagePath = project.thumbnail || data.seo?.ogImage;

  return (
    <div className="relative min-h-screen bg-[#f1e4d0] text-[#1f2a37]">
      <Head>
        <title>
          {project.title[lang]} | {data.name}
        </title>
        <meta name="description" content={project.description[lang]} />
        <link rel="canonical" href={siteUrl + "/projects/" + project.slug} />
        {data.seo?.faviconUrl && <link rel="icon" href={data.seo.faviconUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={project.title[lang]} />
        <meta property="og:description" content={project.description[lang]} />
        <meta
          property="og:url"
          content={siteUrl + "/projects/" + project.slug}
        />
        {ogImagePath && (
          <meta property="og:image" content={siteUrl + ogImagePath} />
        )}
      </Head>

      <div className="bg-[#f8f3e8] border-b border-[#ebdccb]">
        <Header />
      </div>

      <div className="content-container pt-12 pb-24">
        <button
          onClick={() => router.push("/#projects")}
          type="button"
          className="text-sm font-raleway font-bold text-[#2f5d56] hover:underline mb-8 inline-flex items-center gap-1.5"
        >
          ← {lang === "en" ? "Back to Projects" : "Kembali ke Proyek"}
        </button>

        <div className="bg-white rounded-2xl border border-[#e5dac8] p-8 tablet:p-12 shadow-[0_4px_24px_rgba(31,42,55,0.05)] mb-12">
          <div className="flex items-center gap-2 mb-3">
            {project.featured && (
              <span className="px-3 py-1 rounded-full bg-[#2f5d56]/10 text-[#2f5d56] text-xs font-raleway font-bold">
                ★ {lang === "en" ? "Featured Project" : "Proyek Unggulan"}
              </span>
            )}
            {project.path && (
              <span className="text-xs font-mono font-semibold text-[#8c8275]">
                {project.path}
              </span>
            )}
          </div>

          <h1 className="font-nunito text-3xl tablet:text-5xl font-extrabold text-[#1f2a37] tracking-tight mb-4">
            {project.title[lang]}
          </h1>
          <p className="font-raleway text-base tablet:text-lg text-[#4b5563] leading-relaxed max-w-3xl mb-8">
            {project.description[lang]}
          </p>

          {/* Action Link Buttons */}
          {project.link && project.link.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#f0e7db]">
              {project.link.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-raleway font-bold bg-[#2f5d56] text-white hover:bg-[#244943] transition-all shadow-sm"
                >
                  <span>{item.label}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        {project.gallery && project.gallery.length > 0 && (
          <div className="grid grid-cols-2 tablet:grid-cols-3 gap-4 mb-12">
            {project.gallery
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((image, idx) => (
                <button
                  key={image.id}
                  onClick={() => setLightboxIndex(idx)}
                  type="button"
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#e5dac8] bg-white shadow-sm hover:shadow-md transition-shadow"
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
          <Lightbox
            images={galleryForLightbox}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-12">
          {project.tags?.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs font-raleway font-semibold px-3.5 py-1.5 rounded-full bg-[#efe7d8] text-[#1f2a37] border border-[#e2d6c3]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Prev / Next Pagination */}
        <div className="flex items-center justify-between border-t border-[#dfd3c3] pt-8">
          {adjacent?.prev ? (
            <a
              href={`/projects/${adjacent.prev.slug}`}
              className="text-sm font-raleway font-bold text-[#2f5d56] hover:underline"
            >
              ← {adjacent.prev.title[lang]}
            </a>
          ) : (
            <span />
          )}
          {adjacent?.next && (
            <a
              href={`/projects/${adjacent.next.slug}`}
              className="text-sm font-raleway font-bold text-[#2f5d56] hover:underline"
            >
              {adjacent.next.title[lang]} →
            </a>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
