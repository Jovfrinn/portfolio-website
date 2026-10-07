const { validatePortfolio } = require("../portfolioSchema");

const validFixture = {
  name: "Jovfrin Joiner",
  nav: {
    en: { home: "Home", project: "Projects", about: "About", contact: "Contact", resume: "Resume" },
    id: { home: "Beranda", project: "Proyek", about: "Tentang", contact: "Kontak", resume: "Resume" },
  },
  headerTaglineOne: { en: "Available", id: "Tersedia" },
  headerTaglineTwo: { en: "Full-Stack Developer.", id: "Full-Stack Developer." },
  headerTaglineThree: { en: "Building things.", id: "Membangun sesuatu." },
  headerTaglineThreeRotations: { en: ["things"], id: ["sesuatu"] },
  headerTaglineFour: { en: "Description.", id: "Deskripsi." },
  heroButtons: [{ id: "1", labelEn: "View projects", labelId: "Lihat proyek", href: "#projects" }],
  statusCard: [{ id: "1", labelEn: "Web App", labelId: "Aplikasi Web", status: "active" }],
  flags: { showCursor: false },
  socials_section: { title: { en: "Connect", id: "Terhubung" }, description: { en: "Find me.", id: "Temukan saya." } },
  socials: [{ id: "1", title: "Github", link: "https://github.com/x", actionEn: "Follow", actionId: "Ikuti", placement: "connect_grid", published: true, order: 0 }],
  projects: [{
    id: "1", slug: "sample-project", path: "~/sample", title: { en: "Sample", id: "Contoh" },
    description: { en: "Desc", id: "Deskripsi" }, thumbnail: null, thumbnailThumb: null, gallery: [],
    role: { en: "", id: "" }, duration: "", problem: { en: "", id: "" }, solution: { en: "", id: "" },
    features: { en: [], id: [] }, impact: { en: [], id: [] }, tags: ["React"],
    link: [{ label: "Live", url: "https://example.com" }], featured: true, published: true, order: 0,
  }],
  services: [{ id: "1", title: { en: "Service", id: "Layanan" }, description: { en: "Desc", id: "Deskripsi" }, published: true, order: 0 }],
  howIWork: { title: { en: "How I Work", id: "Cara Saya Bekerja" }, description: { en: "", id: "" }, steps: [{ id: "1", title: { en: "Discovery", id: "Diskusi" }, description: { en: "d", id: "d" }, order: 0 }] },
  aboutpara: { en: "About", id: "Tentang" },
  techstack: { title: { en: "Tech", id: "Tech" }, description: { en: "", id: "" }, categories: [{ id: "1", name: { en: "Core", id: "Inti" }, order: 0, items: [{ id: "1", name: "React", level: "main" }] }] },
  resume: { tagline: "", description: "", experiences: [], education: { universityName: "", universityDate: "", universityPara: "" }, languages: [], frameworks: [], others: [] },
  footerCta: { title: { en: "Contact", id: "Kontak" }, description: { en: "", id: "" }, emailButtonLabel: { en: "Email me", id: "Email saya" } },
  footerCopyrightText: "Jovfrin Joiner",
  seo: { titleEn: "t", titleId: "t", descriptionEn: "d", descriptionId: "d", keywords: "k", ogImage: null, canonicalUrl: "https://jovfrin.dev", faviconUrl: null },
  resumeFiles: { en: null, id: null },
};

test("accepts a valid fixture", () => {
  const result = validatePortfolio(validFixture);
  expect(result.success).toBe(true);
});

test("rejects em dash characters anywhere in the data", () => {
  const withEmDash = { ...validFixture, aboutpara: { en: "Hello — world", id: "Tentang" } };
  const result = validatePortfolio(withEmDash);
  expect(result.success).toBe(false);
  expect(result.errors.formErrors[0]).toMatch(/em dash/);
});

test("rejects a missing required field", () => {
  const { name, ...missingName } = validFixture;
  const result = validatePortfolio(missingName);
  expect(result.success).toBe(false);
});

test("rejects an invalid tech item level", () => {
  const invalid = JSON.parse(JSON.stringify(validFixture));
  invalid.techstack.categories[0].items[0].level = "expert";
  const result = validatePortfolio(invalid);
  expect(result.success).toBe(false);
});
