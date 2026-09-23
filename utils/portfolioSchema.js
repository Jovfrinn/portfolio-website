const { z } = require("zod");

const bilingual = z.object({ en: z.string(), id: z.string() });
const bilingualArray = z.object({ en: z.array(z.string()), id: z.array(z.string()) });

const heroButtonSchema = z.object({
  id: z.string(),
  labelEn: z.string(),
  labelId: z.string(),
  href: z.string(),
});

const statusCardItemSchema = z.object({
  id: z.string(),
  labelEn: z.string(),
  labelId: z.string(),
  status: z.enum(["active", "in_progress", "open"]),
});

const socialLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string(),
  actionEn: z.string(),
  actionId: z.string(),
  placement: z.enum(["connect_grid", "footer_cta"]),
  published: z.boolean(),
  order: z.number(),
});

const projectLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const galleryImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  thumbSrc: z.string(),
  captionEn: z.string(),
  captionId: z.string(),
  order: z.number(),
});

const projectSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  path: z.string(),
  title: bilingual,
  description: bilingual,
  thumbnail: z.string().nullable(),
  thumbnailThumb: z.string().nullable(),
  gallery: z.array(galleryImageSchema),
  role: bilingual,
  duration: z.string(),
  problem: bilingual,
  solution: bilingual,
  features: bilingualArray,
  impact: bilingualArray,
  tags: z.array(z.string()),
  link: z.array(projectLinkSchema),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number(),
});

const serviceSchema = z.object({
  id: z.string(),
  title: bilingual,
  description: bilingual,
  published: z.boolean(),
  order: z.number(),
});

const howIWorkStepSchema = z.object({
  id: z.string(),
  title: bilingual,
  description: bilingual,
  order: z.number(),
});

const techItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["main", "familiar"]),
});

const techCategorySchema = z.object({
  id: z.string(),
  name: bilingual,
  order: z.number(),
  items: z.array(techItemSchema),
});

const navLocaleSchema = z.object({
  home: z.string(),
  project: z.string(),
  about: z.string(),
  contact: z.string(),
  resume: z.string(),
});

const portfolioSchema = z.object({
  name: z.string(),
  nav: z.object({ en: navLocaleSchema, id: navLocaleSchema }),
  headerTaglineOne: bilingual,
  headerTaglineTwo: bilingual,
  headerTaglineThree: bilingual,
  headerTaglineThreeRotations: bilingualArray,
  headerTaglineFour: bilingual,
  heroButtons: z.array(heroButtonSchema),
  statusCard: z.array(statusCardItemSchema),
  flags: z.object({ showCursor: z.boolean() }),
  socials_section: z.object({ title: bilingual, description: bilingual }),
  socials: z.array(socialLinkSchema),
  projects: z.array(projectSchema),
  services: z.array(serviceSchema),
  howIWork: z.object({
    title: bilingual,
    description: bilingual,
    steps: z.array(howIWorkStepSchema),
  }),
  aboutpara: bilingual,
  techstack: z.object({
    title: bilingual,
    description: bilingual,
    categories: z.array(techCategorySchema),
  }),
  resume: z.object({
    tagline: z.string(),
    description: z.string(),
    experiences: z.array(z.any()),
    education: z.object({
      universityName: z.string(),
      universityDate: z.string(),
      universityPara: z.string(),
    }),
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    others: z.array(z.string()),
  }),
  footerCta: z.object({
    title: bilingual,
    description: bilingual,
    emailButtonLabel: bilingual,
  }),
  footerCopyrightText: z.string(),
  seo: z.object({
    titleEn: z.string(),
    titleId: z.string(),
    descriptionEn: z.string(),
    descriptionId: z.string(),
    keywords: z.string(),
    ogImage: z.string().nullable(),
    canonicalUrl: z.string(),
    faviconUrl: z.string().nullable(),
  }),
  resumeFiles: z.object({
    en: z.string().nullable(),
    id: z.string().nullable(),
  }),
});

function findEmDash(value, path) {
  const currentPath = path || "";
  if (typeof value === "string") {
    return value.indexOf("—") !== -1 ? [currentPath] : [];
  }
  if (Array.isArray(value)) {
    return value.reduce(
      (acc, item, index) => acc.concat(findEmDash(item, currentPath + "[" + index + "]")),
      []
    );
  }
  if (value && typeof value === "object") {
    return Object.keys(value).reduce(
      (acc, key) => acc.concat(findEmDash(value[key], currentPath ? currentPath + "." + key : key)),
      []
    );
  }
  return [];
}

function validatePortfolio(data) {
  const result = portfolioSchema.safeParse(data);
  if (!result.success) {
    return { success: false, data: null, errors: result.error.flatten() };
  }
  const emDashPaths = findEmDash(result.data, "");
  if (emDashPaths.length > 0) {
    return {
      success: false,
      data: null,
      errors: { formErrors: ["Karakter em dash ditemukan di: " + emDashPaths.join(", ")], fieldErrors: {} },
    };
  }
  return { success: true, data: result.data, errors: null };
}

module.exports = { portfolioSchema, validatePortfolio };
