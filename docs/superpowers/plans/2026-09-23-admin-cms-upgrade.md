# Admin CMS Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the portfolio's hardcoded content into content managed through a single-admin `/admin` panel, where every save is validated and published as one Git commit (via GitHub's Git Data API) so Vercel auto-redeploys, with no database and no object storage.

**Architecture:** `data/portfolio.json` stays the single source of truth and keeps being imported directly by pages at build time, now with a much larger bilingual schema validated by Zod. The admin panel is a client-side draft (React Context) that loads the current file + its Git ref sha, lets the admin edit every section, and on "Publish" bundles the edited JSON plus any new/removed WebP images (resized and converted client-side) into one commit through Octokit's Git Data API, with an optimistic-concurrency check against the ref sha. In `NODE_ENV=development`, the same publish path writes straight to the local filesystem instead of calling GitHub.

**Tech Stack:** Next.js 12.3.4 (Pages Router, unchanged), React 18, Tailwind (unchanged), Zod, iron-session v6, bcryptjs, @octokit/rest, @dnd-kit (drag reorder), next/jest + React Testing Library + node-mocks-http.

**Spec:** User-approved architecture discussion in this conversation (original Bahasa Indonesia spec covering Bagian A public pages, Bagian B admin panel, Bagian C data migration, Bagian D quality, plus the no-database revision). No separate spec file exists; this plan is the spec of record.

## Global Constraints

- Next.js pinned to exactly `12.3.4` (needed for stable `res.revalidate`-adjacent APIs the team standardized on; Pages Router only, never upgrade to 13+).
- No database, no Prisma, no Vercel Blob, no ISR revalidate. `data/portfolio.json` is the only data store, committed to Git.
- Every admin write is staged as client-side draft state first; nothing touches disk/Git until "Publish" is pressed.
- Publish bundles portfolio.json + new images + deleted images into exactly one commit in production (via GitHub Git Data API), or one local filesystem write in development.
- Before committing in production, re-fetch the branch ref sha and compare to the sha the client loaded; on mismatch return 409 and tell the admin to reload. Never force-push over a newer sha.
- Images: validated client-side (jpg/png/webp, original ≤10MB), resized and converted to WebP in the browser (thumb 600px wide, full 1600px wide) before ever leaving the browser. No server-side image processing (no sharp).
- Total new-image payload per publish must stay under 4MB, measured on the base64-encoded string length (the actual wire size of the JSON body), not the smaller decoded binary size — a safety margin under Vercel's 4.5MB serverless body limit. Checked client-side before the request is even sent (clear error, no wasted round-trip) and again server-side as a backup. The publish endpoint rejects larger batches with a clear message rather than letting Vercel 413 it.
- `data/portfolio.json` must validate against the Zod schema both in the admin publish path and in a `prebuild` script, so a broken file fails `next build` (and therefore the Vercel deploy) loudly.
- No em dash (`—`) character anywhere in rendered site text or in `data/portfolio.json`; enforced by the schema validator and fixed at the source in this plan's data migration task.
- Single admin only. Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` env vars, never hardcoded. Login rate-limited (lock after 5 failed attempts, simple cookie-based counter, no external store).
- Session cookie: httpOnly, secure in production, sameSite lax. Every admin API route (except `/api/admin/login`) requires a valid session.
- All new backend work happens on a new branch (not `main`), verified through a Vercel Preview deployment before merging.
- Dead legacy template code (`pages/_edit.js`, `pages/_resume.js`, `pages/blog/*`, `pages/api/portfolio.js`, `pages/api/blog/*`, `components/BlogEditor`, `components/WorkCard`, `components/ProjectResume`, `components/Socials`, `data/portfolio copy.json`) is removed in its own commit, before any new feature work.
- Do not redesign. Preserve the existing dark-only visual design, animations, and Tailwind classes; only change where data comes from and add the new sections/pages explicitly requested.
- `.env.example` must list every env var the app needs, each with a one-line comment explaining it.

---

## File Structure

**New shared modules:**
- `utils/portfolioSchema.js` — CommonJS (so it can be `require()`d by a plain Node script outside webpack) Zod schema + `validatePortfolio(data)`, including the em-dash guard.
- `scripts/validate-portfolio.js` — plain Node CLI, wired into `npm run prebuild`.
- `utils/session.js` — iron-session config + `withSessionApi`, `withAdminApi`, `withAdminSsr` helpers.
- `utils/loginRateLimit.js` — cookie-based failed-attempt counter and lockout.
- `utils/github.js` — Octokit wrapper: `getPortfolioSnapshot()`, `publishToGithub(...)`.
- `utils/localPublish.js` — dev-mode direct filesystem reader/writer with the same conflict-check shape as `utils/github.js`.
- `utils/imageProcessing.js` — browser-only: `validateImageFile`, `processImageToWebp`, `blobToBase64`.
- `utils/projects.js` — pure helpers: `getPublishedProjects`, `findProjectBySlug`, `getAdjacentProjects`.

**New API routes:**
- `pages/api/admin/login.js`, `pages/api/admin/logout.js`
- `pages/api/admin/data.js` (GET current portfolio + baseSha)
- `pages/api/admin/publish.js` (POST validated publish, dev/prod branch)

**New admin UI:**
- `components/admin/AdminDraftContext.js`, `AdminLayout.js`, `PublishBar.js`, `ConfirmDialog.js`, `LocaleTabs.js`, `FormField.js`, `SortableList.js`, `ImageUploadField.js`
- `pages/admin/login.js`, `pages/admin/index.js`, `pages/admin/hero.js`, `pages/admin/status-card.js`, `pages/admin/projects/index.js`, `pages/admin/projects/[id].js`, `pages/admin/services.js`, `pages/admin/how-it-works.js`, `pages/admin/about.js`, `pages/admin/tech-stack.js`, `pages/admin/contact-social.js`, `pages/admin/cta.js`, `pages/admin/settings.js`

**New public UI:**
- `components/ProjectCard/index.js`, `components/Lightbox/index.js`
- `pages/projects/[slug].js`, `pages/404.js`

**Modified:**
- `package.json` (Next 12.3.4, new deps, `prebuild`/`test` scripts), `next.config.js` (unchanged content, just re-verified against 12.3.4), `pages/_app.js` (conditional `AdminDraftProvider`), `pages/index.js`, `components/Hero/index.js`, `components/Header/index.js`, `components/Footer/index.js`, `components/Button/index.js`, `data/portfolio.json` (fully migrated content).

**Deleted:** `pages/_edit.js`, `pages/_resume.js`, `pages/blog/index.js`, `pages/blog/[slug].js`, `pages/api/portfolio.js`, `pages/api/blog/edit.js`, `pages/api/blog/index.js`, `components/BlogEditor/index.js`, `components/WorkCard/index.js`, `components/ProjectResume/index.js`, `components/Socials/index.js`, `data/portfolio copy.json`.

---

## Phase 0: Branch, Next.js upgrade, dead code removal

### Task 1: Create the feature branch

**Files:** none (git only)

- [ ] **Step 1: Create and switch to the branch**

```bash
git checkout -b feature/admin-cms-github-publish
```

- [ ] **Step 2: Confirm clean status**

```bash
git status
```

Expected: `On branch feature/admin-cms-github-publish`, working tree clean (matches `main`).

### Task 2: Upgrade Next.js to 12.3.4

**Files:**
- Modify: `package.json:18` (`next` version), `package.json:37` (`eslint-config-next` version)

- [ ] **Step 1: Bump versions in package.json**

```json
"next": "12.3.4",
```
and in devDependencies:
```json
"eslint-config-next": "12.3.4",
```

- [ ] **Step 2: Install and verify**

```bash
npm install --legacy-peer-deps
npm run build
```

Expected: build completes successfully (`.next` output produced, no type/module resolution errors). If `npm install` reports peer conflicts, `.npmrc`'s `legacy-peer-deps=true` already covers it.

- [ ] **Step 3: Smoke-test dev server**

```bash
npm run dev
```

Visit `http://localhost:3000` and confirm the homepage renders exactly as before (no visual regression from the version bump alone).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade Next.js to 12.3.4"
```

### Task 3: Remove dead legacy template code

**Files:**
- Delete: `pages/_edit.js`, `pages/_resume.js`, `pages/blog/index.js`, `pages/blog/[slug].js`, `pages/api/portfolio.js`, `pages/api/blog/edit.js`, `pages/api/blog/index.js`, `components/BlogEditor/index.js`, `components/WorkCard/index.js`, `components/ProjectResume/index.js`, `components/Socials/index.js`, `data/portfolio copy.json`
- Modify: `components/Header/index.js` (remove `showBlog`-gated Blog nav buttons and the dead `showResume` destructure)

**Interfaces:**
- Produces: `Header` no longer references `data.showBlog` / `data.showResume`; its only remaining data destructure is `const { name } = data;` until Task 37 replaces `data` reads with the new schema fields.

- [ ] **Step 1: Confirm nothing else imports the doomed files**

```bash
grep -rln "components/Socials\|components/WorkCard\|components/ProjectResume\|components/BlogEditor\|pages/blog\|pages/_edit\|pages/_resume\|api/portfolio\|api/blog" pages components utils 2>/dev/null | grep -v node_modules
```

Expected: only the files being deleted themselves show up (already verified during analysis: `WorkCard`/`ProjectResume` only used by `_resume.js`; `BlogEditor` only by `blog/[slug].js`; `Socials` unused anywhere; `showBlog` only gates two dead Blog nav buttons in `Header`).

- [ ] **Step 2: Delete the files**

```bash
git rm pages/_edit.js pages/_resume.js pages/blog/index.js "pages/blog/[slug].js" pages/api/portfolio.js pages/api/blog/edit.js pages/api/blog/index.js
git rm components/BlogEditor/index.js components/WorkCard/index.js components/ProjectResume/index.js components/Socials/index.js
git rm "data/portfolio copy.json"
rmdir pages/blog pages/api/blog components/BlogEditor components/WorkCard components/ProjectResume components/Socials 2>/dev/null || true
```

- [ ] **Step 3: Strip the dead Blog nav buttons and flags from Header**

In `components/Header/index.js`, remove:
```js
const { name, showBlog, showResume } = data;
```
replace with:
```js
const { name } = data;
```
Then remove every block shaped like:
```js
{showBlog && (
  <button
    onClick={() => router.push("/blog")}
    className="..."
  >
    Blog
  </button>
)}
```
(there are 4 occurrences: mobile menu, desktop nav, mobile "isBlog" branch, desktop "isBlog" branch). Also delete the now-unreachable `isBlog`-branch buttons that only exist to navigate back from `/blog` (the `t.home` button and its wrapping `<>...</>` alternative branch), collapsing each `{!isBlog ? (...) : (...)}` down to just the first branch's contents, since `isBlog` can no longer be true from any live route. Remove the `isBlog` prop from the component signature (`const Header = ({ handleWorkScroll, handleAboutScroll, isBlog }) => {` becomes `const Header = ({ handleWorkScroll, handleAboutScroll }) => {`).

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
```

Expected: success, no reference errors to the deleted modules or removed `isBlog`/`showBlog` variables.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead legacy template code (unauthenticated dev-only editor, unused blog/resume routes)"
```

> **Stop and run Task 41 (Jest configuration) now, before Task 4.** Every `npx jest ...` verification step from here through Task 40 assumes `jest.config.js`/`jest.setup.js` and the test dependencies already exist. Task 41 is written down in Phase 7 (grouped there with the rest of this plan's project-hygiene work), but it must execute immediately after this task, not in Phase-7 document order.

## Phase 1: Data schema, validation, and content migration

### Task 4: Install Zod and write the schema

**Files:**
- Create: `utils/portfolioSchema.js`
- Modify: `package.json` (add `zod` dependency)

**Interfaces:**
- Produces: `validatePortfolio(data) -> { success: boolean, data: object|null, errors: object|null }`, used by Task 5 (build-time script), Task 15 (`/api/admin/publish`), and every admin page indirectly through the publish flow.

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Write the failing test**

Create `utils/__tests__/portfolioSchema.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/__tests__/portfolioSchema.test.js`
Expected: FAIL with `Cannot find module '../portfolioSchema'`.

- [ ] **Step 3: Write the schema**

Create `utils/portfolioSchema.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/__tests__/portfolioSchema.test.js`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/portfolioSchema.js utils/__tests__/portfolioSchema.test.js package.json package-lock.json
git commit -m "feat: add Zod schema and validator for the expanded portfolio.json shape"
```

### Task 5: Build-time validation script

**Files:**
- Create: `scripts/validate-portfolio.js`
- Modify: `package.json` (`scripts.prebuild`)

**Interfaces:**
- Consumes: `validatePortfolio` from `utils/portfolioSchema.js` (Task 4).

- [ ] **Step 1: Write the script**

Create `scripts/validate-portfolio.js`:

```js
const fs = require("fs");
const path = require("path");
const { validatePortfolio } = require("../utils/portfolioSchema");

const filePath = path.join(process.cwd(), "data", "portfolio.json");
const raw = fs.readFileSync(filePath, "utf-8");
const json = JSON.parse(raw);
const result = validatePortfolio(json);

if (!result.success) {
  console.error("data/portfolio.json tidak valid:");
  console.error(JSON.stringify(result.errors, null, 2));
  process.exit(1);
}

console.log("data/portfolio.json valid.");
```

- [ ] **Step 2: Wire it into the build**

In `package.json`, add:
```json
"prebuild": "node scripts/validate-portfolio.js",
```
above the existing `"build": "next build"` line (npm runs `prebuild` automatically before `build`).

- [ ] **Step 3: Verify it currently fails**

Run: `node scripts/validate-portfolio.js`
Expected: FAIL, since the current `data/portfolio.json` does not yet match the new schema (missing `nav`, `heroButtons`, `statusCard`, `flags`, expanded `projects`, etc.) — this confirms the script is actually checking something. This failure is expected and will be resolved by Task 6.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-portfolio.js package.json
git commit -m "feat: fail the build when data/portfolio.json does not match the schema"
```

### Task 6: Migrate and fix `data/portfolio.json`

**Files:**
- Modify: `data/portfolio.json` (full rewrite to the new schema shape)

This task performs, in one file, every content fix and every new field required by later tasks:
- Removes all 4 existing em dash occurrences (`headerTaglineFour.en/id`, project 1 `description.id`, `aboutpara.en/id`), replacing them with commas or colons that preserve meaning.
- Fixes the double-space bug in project 1's English description (`"field sales  GPS check-in"` → `"field sales: GPS check-in"`).
- Empties `resume.*` per instruction (template data was wrong; admin will refill later).
- Adds `nav`, `heroButtons`, `statusCard`, `flags`, `howIWork`, `footerCta`, `footerCopyrightText`, `seo`, `resumeFiles`.
- Converts `techstack` category items from `string[]` to `{id, name, level}[]`, adding the missing `Bootstrap` item and marking exactly the 10 items the spec calls "Main" (`React JS`, `Laravel`, `React Native`, `MySQL`, `REST API`, `Git`, `Bootstrap`, `JavaScript`, `PHP`, `SQL`); everything else becomes `familiar`.
- Adds 2 new services (`Print Layout & Invoice`, `Mobile App & App Store Deployment`) and `published`/`order` to all 6 services.
- Expands every project with the new detail-page fields (`slug`, `thumbnail`, `thumbnailThumb`, `gallery`, `role`, `duration`, `problem`, `solution`, `features`, `impact`, `featured`, `published`, `order`); detail fields with no prior source content are left as empty strings/arrays for the admin to fill in, since there is nothing hardcoded to migrate for them.
- Converts `socials` into `{id, title, link, actionEn, actionId, placement, published, order}[]`, adding `FastWork` and `Projects.co.id` (currently hardcoded buttons in `Footer`) with `placement: "footer_cta"`.
- Drops the dead `showBlog`, `darkMode`, `showResume` flags (confirmed unused outside deleted dead code in Task 3) in favor of `flags: { showCursor }`.

- [ ] **Step 1: Write the new file**

Replace the entire contents of `data/portfolio.json` with:

```json
{
  "name": "Jovfrin Joiner",
  "nav": {
    "en": { "home": "Home", "project": "Projects", "about": "About", "contact": "Contact", "resume": "Resume" },
    "id": { "home": "Beranda", "project": "Proyek", "about": "Tentang", "contact": "Kontak", "resume": "Resume" }
  },
  "headerTaglineOne": {
    "en": "Available for freelance projects",
    "id": "Tersedia untuk proyek lepas (freelance)"
  },
  "headerTaglineTwo": {
    "en": "Full-Stack Developer.",
    "id": "Full-Stack Developer."
  },
  "headerTaglineThree": {
    "en": "Building systems & websites that actually get used.",
    "id": "Bikin sistem & website yang beneran kepake."
  },
  "headerTaglineThreeRotations": {
    "en": ["systems & websites", "CRM & CMS", "ERP systems", "e-learning platforms", "mobile apps", "internal systems"],
    "id": ["sistem & website", "CRM & CMS", "sistem ERP", "platform e-learning", "aplikasi mobile", "sistem internal"]
  },
  "headerTaglineFour": {
    "en": "Experienced in building ERP, CRM, CMS, e-learning, to mobile apps: end-to-end from database, API, to responsive design.",
    "id": "Berpengalaman bangun ERP, CRM, CMS, e-learning, sampai aplikasi mobile: end-to-end dari database, API, sampai tampilan responsif."
  },
  "heroButtons": [
    { "id": "1", "labelEn": "View projects", "labelId": "Lihat proyek", "href": "#work" },
    { "id": "2", "labelEn": "Contact me", "labelId": "Hubungi saya", "href": "mailto:jovfrinjoiner01@gmail.com" }
  ],
  "statusCard": [
    { "id": "1", "labelEn": "Web Application Development", "labelId": "Pengembangan Aplikasi Web", "status": "active" },
    { "id": "2", "labelEn": "CRM / CMS Systems", "labelId": "Sistem CRM / CMS", "status": "active" },
    { "id": "3", "labelEn": "E-Learning Platform", "labelId": "Platform E-Learning", "status": "active" },
    { "id": "4", "labelEn": "E-Commerce Platform", "labelId": "Platform E-Commerce", "status": "active" },
    { "id": "5", "labelEn": "Mobile Application (React Native)", "labelId": "Aplikasi Mobile (React Native)", "status": "active" },
    { "id": "6", "labelEn": "ERP System", "labelId": "Sistem ERP", "status": "in_progress" },
    { "id": "7", "labelEn": "New project", "labelId": "Proyek baru", "status": "open" }
  ],
  "flags": { "showCursor": false },
  "socials_section": {
    "title": { "en": "Let's Connect", "id": "Media Sosial" },
    "description": { "en": "Find me on my digital profiles. Feel free to connect, collaborate, or just say hello!", "id": "Hubungi saya atau ikuti aktivitas saya di berbagai platform digital berikut." }
  },
  "socials": [
    { "id": "1", "title": "Github", "link": "https://github.com/Jovfrinn", "actionEn": "Follow on GitHub", "actionId": "Ikuti di GitHub", "placement": "connect_grid", "published": true, "order": 0 },
    { "id": "2", "title": "LinkedIn", "link": "https://www.linkedin.com/in/jovfrin-joiner-elevait-gulo/", "actionEn": "Connect on LinkedIn", "actionId": "Terhubung di LinkedIn", "placement": "connect_grid", "published": true, "order": 1 },
    { "id": "3", "title": "WhatsApp", "link": "https://wa.me/6281211963047", "actionEn": "Chat on WhatsApp", "actionId": "Chat di WhatsApp", "placement": "connect_grid", "published": true, "order": 2 },
    { "id": "5", "title": "Email", "link": "mailto:jovfrinjoiner01@gmail.com", "actionEn": "Send an email", "actionId": "Kirim email", "placement": "connect_grid", "published": true, "order": 3 },
    { "id": "6", "title": "FastWork", "link": "https://fastwork.id/user/jovfrinn", "actionEn": "View on FastWork", "actionId": "Lihat di FastWork", "placement": "footer_cta", "published": true, "order": 4 },
    { "id": "7", "title": "Projects.co.id", "link": "https://projects.co.id/public/browse_users/view/f8f26b/jovfrinnn", "actionEn": "View on Projects.co.id", "actionId": "Lihat di Projects.co.id", "placement": "footer_cta", "published": true, "order": 5 }
  ],
  "projects": [
    {
      "id": "1", "slug": "field-sales-crm", "path": "~/mysales",
      "title": { "en": "Field Sales CRM (SFA + CRM)", "id": "Field Sales CRM (SFA + CRM)" },
      "description": {
        "en": "Mobile first CRM for FMCG field sales: GPS check-in, ordering, stock tracking, and journey plans with supervisor approval flows.",
        "id": "Aplikasi untuk salesman lapangan industri FMCG: GPS check-in ke outlet, input stok/penjualan/order per kunjungan, journey plan dengan approval flow SPV, dan fitur CRM seperti Customer 360, Interaction Log, dan Follow-up Reminder."
      },
      "thumbnail": null, "thumbnailThumb": null, "gallery": [],
      "role": { "en": "", "id": "" }, "duration": "",
      "problem": { "en": "", "id": "" }, "solution": { "en": "", "id": "" },
      "features": { "en": [], "id": [] }, "impact": { "en": [], "id": [] },
      "tags": ["React JS", "Laravel", "MySQL", "Approval Flow", "React Native", "GPS", "REST API"],
      "link": [
        { "label": "Frontend", "url": "https://github.com/Jovfrinn/sfa-frontend-web" },
        { "label": "Backend", "url": "https://github.com/Jovfrinn/sfa-backend" },
        { "label": "Mobile", "url": "https://github.com/Jovfrinn/sfa-frontend-mobile" }
      ],
      "featured": true, "published": true, "order": 0
    },
    {
      "id": "2", "slug": "enterprise-lms", "path": "~/edutrack",
      "title": { "en": "Enterprise Learning Management System (E-LMS)", "id": "Enterprise Learning Management System (E-LMS)" },
      "description": {
        "en": "A web-based employee training platform that helps companies manage courses, assess competencies, and monitor HR progress centrally.",
        "id": "Platform pelatihan karyawan berbasis web yang membantu perusahaan mengelola kursus, menilai kompetensi, dan memantau perkembangan SDM secara terpusat."
      },
      "thumbnail": null, "thumbnailThumb": null, "gallery": [],
      "role": { "en": "", "id": "" }, "duration": "",
      "problem": { "en": "", "id": "" }, "solution": { "en": "", "id": "" },
      "features": { "en": [], "id": [] }, "impact": { "en": [], "id": [] },
      "tags": ["React JS", "Laravel", "MySQL", "Analytics", "Reporting", "Gamification", "REST API"],
      "link": [
        { "label": "Frontend", "url": "https://github.com/Jovfrinn/lms-edutrack-fe" },
        { "label": "Backend", "url": "https://github.com/Jovfrinn/lms-edutrack-be" }
      ],
      "featured": false, "published": true, "order": 1
    },
    {
      "id": "3", "slug": "custom-web-cms", "path": "~/cms",
      "title": { "en": "Custom Web Content Management System (CMS)", "id": "Custom Web Content Management System (CMS)" },
      "description": {
        "en": "A web-based content management application to manage information, publish articles, and create dynamic pages without coding, equipped with media manager.",
        "id": "Aplikasi manajemen konten berbasis web untuk mengelola informasi, publikasi artikel, dan halaman dinamis secara instan tanpa koding, dilengkapi dengan media manager dan penataan menu yang fleksibel."
      },
      "thumbnail": null, "thumbnailThumb": null, "gallery": [],
      "role": { "en": "", "id": "" }, "duration": "",
      "problem": { "en": "", "id": "" }, "solution": { "en": "", "id": "" },
      "features": { "en": [], "id": [] }, "impact": { "en": [], "id": [] },
      "tags": ["React JS", "Laravel", "MySQL", "REST API"],
      "link": [{ "label": "Live", "url": "https://smpn64jkt.sch.id/" }],
      "featured": false, "published": true, "order": 2
    },
    {
      "id": "4", "slug": "tefa-ecommerce", "path": "~/tefa",
      "title": { "en": "E-Commerce Platform for School Teaching Factory (TEFA)", "id": "E-Commerce Platform untuk TEFA Sekolah" },
      "description": {
        "en": "An e-commerce web application for Teaching Factory (TEFA) business units in schools, allowing customers to check products, stock, prices, and shop online.",
        "id": "Web e-commerce untuk unit usaha Teaching Factory (TEFA) di lingkungan sekolah, supaya pelanggan bisa cek produk, stok, harga, dan belanja online tanpa harus datang langsung."
      },
      "thumbnail": null, "thumbnailThumb": null, "gallery": [],
      "role": { "en": "", "id": "" }, "duration": "",
      "problem": { "en": "", "id": "" }, "solution": { "en": "", "id": "" },
      "features": { "en": [], "id": [] }, "impact": { "en": [], "id": [] },
      "tags": ["Blade", "Laravel", "MySQL", "Midtrans"],
      "link": [{ "label": "Repo", "url": "https://github.com/Jovfrinn/web-dev" }],
      "featured": false, "published": true, "order": 3
    },
    {
      "id": "5", "slug": "cocokin-ai", "path": "~/cocokin",
      "title": { "en": "Cocokin.ai - Vector Similarity Relationship Calculator", "id": "Cocokin.ai - Kalkulator Keselarasan Hubungan Berbasis Vektor" },
      "description": {
        "en": "A premium web application that measures mental alignment and shared principles between two users using Cosine Similarity on N-dimensional preferences.",
        "id": "Aplikasi web premium untuk mengukur tingkat keselarasan dan kesamaan prinsip antara dua pengguna menggunakan metode Cosine Similarity dalam ruang vektor N-dimensi."
      },
      "thumbnail": null, "thumbnailThumb": null, "gallery": [],
      "role": { "en": "", "id": "" }, "duration": "",
      "problem": { "en": "", "id": "" }, "solution": { "en": "", "id": "" },
      "features": { "en": [], "id": [] }, "impact": { "en": [], "id": [] },
      "tags": ["React JS", "TypeScript", "Tailwind CSS", "NestJS", "Prisma ORM", "PostgreSQL", "Google OAuth", "Recharts", "Cosine Similarity"],
      "link": [
        { "label": "Frontend", "url": "https://github.com/Jovfrinn/cocokin-frontend" },
        { "label": "Backend", "url": "https://github.com/Jovfrinn/cocokin-backend" }
      ],
      "featured": false, "published": true, "order": 4
    }
  ],
  "services": [
    { "id": "1", "title": { "en": "ERP & Internal System Development", "id": "Pengembangan ERP & Sistem Internal" }, "description": { "en": "Building custom ERP systems for purchase requests, stock-taking, sales orders, invoicing, and complex approval workflows.", "id": "Membangun sistem ERP custom untuk purchase request, stok opname, mutasi barang, sales order, invoicing, hingga approval flow kompleks." }, "published": true, "order": 0 },
    { "id": "2", "title": { "en": "Full Stack Web Development", "id": "Pengembangan Web Full Stack" }, "description": { "en": "End-to-end web application development using React/Next.js on frontend, Node.js/PHP on backend, and PostgreSQL/MySQL databases.", "id": "Pengembangan aplikasi web end-to-end menggunakan React/Next.js di frontend, Node.js/PHP di backend, dan database PostgreSQL/MySQL." }, "published": true, "order": 1 },
    { "id": "3", "title": { "en": "Database Optimization & Integration", "id": "Optimasi & Integrasi Basis Data" }, "description": { "en": "Designing efficient database schemas, data migration, and integrating third-party APIs (payment gateways, shipping, barcode scanners).", "id": "Merancang skema database yang efisien, migrasi data, integrasi API pihak ketiga (payment gateway, kurir, barcode scanner)." }, "published": true, "order": 2 },
    { "id": "4", "title": { "en": "Custom Approval & Workflow Systems", "id": "Sistem Approval & Workflow Custom" }, "description": { "en": "Automating manual company workflows into digital flows with email/WhatsApp notifications and audit logs.", "id": "Otomatisasi alur kerja manual perusahaan menjadi flow digital dengan notifikasi email/WhatsApp dan log audit lengkap." }, "published": true, "order": 3 },
    { "id": "5", "title": { "en": "Print Layout & Invoice", "id": "Print Layout & Invoice" }, "description": { "en": "Designing A4 print layouts such as invoices, delivery notes, and official documents with letterhead and signature columns.", "id": "Desain layout cetak A4 seperti invoice, surat jalan, dan dokumen resmi dengan kop surat dan kolom tanda tangan." }, "published": true, "order": 4 },
    { "id": "6", "title": { "en": "Mobile App & App Store Deployment", "id": "Mobile App & App Store Deployment" }, "description": { "en": "React Native iOS applications from development through publishing on the App Store.", "id": "Aplikasi React Native iOS dari development sampai publish ke App Store." }, "published": true, "order": 5 }
  ],
  "howIWork": {
    "title": { "en": "How I Work", "id": "Cara Saya Bekerja" },
    "description": { "en": "A clear step-by-step process from first conversation to post-launch support.", "id": "Alur kerja yang jelas, dari diskusi awal sampai dukungan setelah launching." },
    "steps": [
      { "id": "1", "title": { "en": "Discovery", "id": "Discovery" }, "description": { "en": "Discussing needs and business goals, free initial consultation.", "id": "Diskusi kebutuhan dan tujuan bisnis, konsultasi gratis." }, "order": 0 },
      { "id": "2", "title": { "en": "Scope & Estimate", "id": "Scope & Estimasi" }, "description": { "en": "SOW, timeline, and cost agreed upon at the start.", "id": "SOW, timeline, dan biaya disepakati di awal." }, "order": 1 },
      { "id": "3", "title": { "en": "Design", "id": "Design" }, "description": { "en": "Database structure and UI mockups designed before coding.", "id": "Rancangan struktur database dan mockup UI sebelum coding." }, "order": 2 },
      { "id": "4", "title": { "en": "Development", "id": "Development" }, "description": { "en": "Regular progress updates and a demo at every milestone.", "id": "Progres rutin dan demo di setiap milestone." }, "order": 3 },
      { "id": "5", "title": { "en": "Testing & Revision", "id": "Testing & Revisi" }, "description": { "en": "Testing together with the client, revisions as agreed.", "id": "Uji bersama klien, revisi sesuai kesepakatan." }, "order": 4 },
      { "id": "6", "title": { "en": "Launch & Handover", "id": "Launch & Handover" }, "description": { "en": "Deployment, source code handover, documentation, and access.", "id": "Deploy, serah terima source code, dokumentasi, dan akses." }, "order": 5 },
      { "id": "7", "title": { "en": "Support", "id": "Support" }, "description": { "en": "Bug-fix warranty after launch.", "id": "Garansi perbaikan bug setelah launch." }, "order": 6 }
    ]
  },
  "aboutpara": {
    "en": "Hi, I'm Jovfrin a Full-Stack Developer currently studying Information Systems at Pamulang University. I have experience building CRM, CMS, e-learning, and ERP internal systems, from database design, REST APIs, to clean & responsive UI. Currently active as a Full-Stack Developer at PT Univerz Teknologi Utama, while accepting freelance projects. Ready to help from scratch to completion!",
    "id": "Halo, saya Jovfrin, Full-Stack Developer lulusan RPL yang lagi lanjut kuliah Sistem Informasi di Universitas Pamulang. Udah berpengalaman bangun CRM, CMS, e-learning, sampai sistem internal perusahaan (ERP), dari desain database, REST API, hingga tampilan yang rapi dan responsif. Saat ini aktif sebagai Full-Stack Developer di PT Univerz Teknologi Utama, sambil terima project freelance. Siap bantu dari nol sampai selesai, konsultasi awal gratis!"
  },
  "techstack": {
    "title": { "en": "Tech Stack", "id": "Tech Stack" },
    "description": { "en": "The technologies, frameworks, and tools I use to build robust and scalable systems.", "id": "Teknologi, framework, dan tools yang saya gunakan untuk membangun sistem yang andal dan skalabel." },
    "categories": [
      {
        "id": "1", "name": { "en": "Languages & Core", "id": "Bahasa Pemrograman" }, "order": 0,
        "items": [
          { "id": "1", "name": "JavaScript", "level": "main" },
          { "id": "2", "name": "TypeScript", "level": "familiar" },
          { "id": "3", "name": "PHP", "level": "main" },
          { "id": "4", "name": "SQL", "level": "main" },
          { "id": "5", "name": "HTML5 & CSS3", "level": "familiar" },
          { "id": "6", "name": "Python", "level": "familiar" }
        ]
      },
      {
        "id": "2", "name": { "en": "Frameworks & Libraries", "id": "Framework & Library" }, "order": 1,
        "items": [
          { "id": "7", "name": "React JS", "level": "main" },
          { "id": "8", "name": "Next.js", "level": "familiar" },
          { "id": "9", "name": "Node.js", "level": "familiar" },
          { "id": "10", "name": "Laravel", "level": "main" },
          { "id": "11", "name": "React Native", "level": "main" },
          { "id": "12", "name": "Tailwind CSS", "level": "familiar" },
          { "id": "13", "name": "Bootstrap", "level": "main" },
          { "id": "14", "name": "Express.js", "level": "familiar" },
          { "id": "15", "name": "Nest.js", "level": "familiar" },
          { "id": "16", "name": "Prisma ORM", "level": "familiar" }
        ]
      },
      {
        "id": "3", "name": { "en": "Databases & Storage", "id": "Database & Storage" }, "order": 2,
        "items": [
          { "id": "17", "name": "MySQL", "level": "main" },
          { "id": "18", "name": "PostgreSQL", "level": "familiar" },
          { "id": "19", "name": "SQL Server", "level": "familiar" },
          { "id": "20", "name": "Redis", "level": "familiar" }
        ]
      },
      {
        "id": "4", "name": { "en": "Tools & DevOps", "id": "Tools & DevOps" }, "order": 3,
        "items": [
          { "id": "21", "name": "Git", "level": "main" },
          { "id": "22", "name": "Docker", "level": "familiar" },
          { "id": "23", "name": "REST API", "level": "main" },
          { "id": "24", "name": "Postman", "level": "familiar" },
          { "id": "25", "name": "Firebase", "level": "familiar" },
          { "id": "26", "name": "Supabase", "level": "familiar" }
        ]
      }
    ]
  },
  "resume": {
    "tagline": "",
    "description": "",
    "experiences": [],
    "education": { "universityName": "", "universityDate": "", "universityPara": "" },
    "languages": [],
    "frameworks": [],
    "others": []
  },
  "footerCta": {
    "title": { "en": "Need an internal system?", "id": "Punya kebutuhan sistem internal?" },
    "description": { "en": "From purchase requests to approval flows custom built for your company's workflows. Let's discuss.", "id": "Dari purchase request sampai approval flow, bisa dibangun custom sesuai alur kerja perusahaan kamu. Yuk diskusi." },
    "emailButtonLabel": { "en": "Email me", "id": "Email saya" }
  },
  "footerCopyrightText": "Jovfrin Joiner",
  "seo": {
    "titleEn": "Jovfrin Joiner | Full-Stack Developer",
    "titleId": "Jovfrin Joiner | Full-Stack Developer",
    "descriptionEn": "Portfolio of Jovfrin Joiner, a Full-Stack Developer specializing in building robust, custom ERP systems, CRM, CMS, e-learning platforms, and mobile apps.",
    "descriptionId": "Portfolio Jovfrin Joiner, seorang Full-Stack Developer yang berspesialisasi dalam membangun sistem ERP custom, CRM, CMS, platform e-learning, dan aplikasi mobile.",
    "keywords": "Jovfrin Joiner, Jovfrin, Joiner, Full-Stack Developer, Web Developer, Software Engineer, ERP Developer, Indonesia, Pamulang, React, Next.js, Laravel, React Native, Tailwind CSS",
    "ogImage": null,
    "canonicalUrl": "https://jovfrin.dev",
    "faviconUrl": null
  },
  "resumeFiles": {
    "en": "/images/Resume-(English).pdf",
    "id": "/images/Resume-(Indonesia).pdf"
  }
}
```

- [ ] **Step 2: Validate**

```bash
node scripts/validate-portfolio.js
```

Expected: `data/portfolio.json valid.`

- [ ] **Step 3: Grep for any remaining em dash**

```bash
grep -n $'—' data/portfolio.json
```

Expected: no output (no matches).

- [ ] **Step 4: Commit**

```bash
git add data/portfolio.json
git commit -m "content: migrate portfolio.json to the expanded CMS schema, fix em dashes and template resume data"
```

---
## Phase 2: Authentication

### Task 7: Session infrastructure

**Files:**
- Create: `utils/session.js`
- Modify: `package.json` (add `iron-session`)

**Interfaces:**
- Produces: `withSessionApi(handler)`, `withAdminApi(handler)`, `withAdminSsr(getPropsFn?)` — consumed by every `pages/api/admin/*.js` route (Tasks 9, 14, 15) and every `pages/admin/*.js` page (Tasks 21-32) via `export const getServerSideProps = withAdminSsr(...)`.

- [ ] **Step 1: Install iron-session v6**

```bash
npm install iron-session@^6.3.1
```

(Pinned to the v6 line deliberately: it ships the `iron-session/next` helpers `withIronSessionApiRoute`/`withIronSessionSsr` built for the Pages Router. v8 dropped those in favor of App Router-only APIs.)

- [ ] **Step 2: Write the module**

Create `utils/session.js`:

```js
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";

export const sessionOptions = {
  cookieName: "portfolio_admin_session",
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function withSessionApi(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withAdminApi(handler) {
  return withIronSessionApiRoute(async (req, res) => {
    if (!req.session.admin) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    return handler(req, res);
  }, sessionOptions);
}

export function withAdminSsr(getPropsFn) {
  return withIronSessionSsr(async (context) => {
    if (!context.req.session.admin) {
      return { redirect: { destination: "/admin/login", permanent: false } };
    }
    return getPropsFn ? getPropsFn(context) : { props: {} };
  }, sessionOptions);
}
```

- [ ] **Step 3: Write a smoke test**

Create `utils/__tests__/session.test.js`:

```js
/** @jest-environment node */
const { sessionOptions } = require("../session");

test("session cookie is httpOnly and sameSite lax", () => {
  expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
  expect(sessionOptions.cookieOptions.sameSite).toBe("lax");
});

test("cookie is secure only outside development", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  jest.resetModules();
  const prodSession = require("../session");
  expect(prodSession.sessionOptions.cookieOptions.secure).toBe(true);
  process.env.NODE_ENV = originalEnv;
});
```

Note: `utils/session.js` uses ESM `import` (unlike `utils/portfolioSchema.js`), consistent with every existing `pages/api/*.js` file in this repo, which is fine since it is only ever loaded through Next's webpack build, never via plain `node`.

- [ ] **Step 4: Run and verify pass**

Run: `npx jest utils/__tests__/session.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/session.js utils/__tests__/session.test.js package.json package-lock.json
git commit -m "feat: add iron-session config and admin session guards"
```

### Task 8: Cookie-based login rate limiting

**Files:**
- Create: `utils/loginRateLimit.js`

**Interfaces:**
- Produces: `isLocked(req)`, `lockRemainingMs(req)`, `registerFailedAttempt(req, res)`, `clearAttempts(req, res)` — consumed by `pages/api/admin/login.js` (Task 9).

- [ ] **Step 1: Write the failing test**

Create `utils/__tests__/loginRateLimit.test.js`:

```js
/** @jest-environment node */
const httpMocks = require("node-mocks-http");
const { isLocked, registerFailedAttempt, clearAttempts } = require("../loginRateLimit");

function cookieHeaderFromRes(res) {
  const setCookie = res.getHeader("Set-Cookie");
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(";")[0];
}

test("locks after 5 failed attempts and unlocks after clearAttempts", () => {
  let req = httpMocks.createRequest({ cookies: {} });
  let res = httpMocks.createResponse();

  for (let i = 0; i < 5; i++) {
    registerFailedAttempt(req, res);
    const [, value] = cookieHeaderFromRes(res).split("=");
    req = httpMocks.createRequest({ cookies: { portfolio_login_attempts: value } });
    res = httpMocks.createResponse();
  }

  expect(isLocked(req)).toBe(true);

  clearAttempts(req, res);
  const [, clearedValue] = cookieHeaderFromRes(res).split("=");
  const clearedReq = httpMocks.createRequest({ cookies: { portfolio_login_attempts: clearedValue } });
  expect(isLocked(clearedReq)).toBe(false);
});

test("is not locked before 5 attempts", () => {
  let req = httpMocks.createRequest({ cookies: {} });
  let res = httpMocks.createResponse();

  for (let i = 0; i < 4; i++) {
    registerFailedAttempt(req, res);
    const [, value] = cookieHeaderFromRes(res).split("=");
    req = httpMocks.createRequest({ cookies: { portfolio_login_attempts: value } });
    res = httpMocks.createResponse();
  }

  expect(isLocked(req)).toBe(false);
});
```

- [ ] **Step 2: Install the test dependency and verify the test fails**

```bash
npm install --save-dev node-mocks-http
npx jest utils/__tests__/loginRateLimit.test.js
```

Expected: FAIL with `Cannot find module '../loginRateLimit'`.

- [ ] **Step 3: Write the module**

Create `utils/loginRateLimit.js`:

```js
const COOKIE_NAME = "portfolio_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function readState(req) {
  const raw = req.cookies[COOKIE_NAME];
  if (!raw) return { count: 0, lockedUntil: 0 };
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return { count: parsed.count || 0, lockedUntil: parsed.lockedUntil || 0 };
  } catch (error) {
    return { count: 0, lockedUntil: 0 };
  }
}

function writeState(res, state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf-8").toString("base64");
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    COOKIE_NAME + "=" + encoded + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=900" + secureFlag
  );
}

function isLocked(req) {
  return readState(req).lockedUntil > Date.now();
}

function lockRemainingMs(req) {
  return Math.max(0, readState(req).lockedUntil - Date.now());
}

function registerFailedAttempt(req, res) {
  const state = readState(req);
  const count = state.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
  writeState(res, { count, lockedUntil });
}

function clearAttempts(req, res) {
  writeState(res, { count: 0, lockedUntil: 0 });
}

module.exports = { isLocked, lockRemainingMs, registerFailedAttempt, clearAttempts };
```

- [ ] **Step 4: Run and verify pass**

Run: `npx jest utils/__tests__/loginRateLimit.test.js`
Expected: PASS.

Note on the tradeoff: this counter lives in a short-lived (15 min) unauthenticated cookie scoped to the browser making the request, not a shared server-side store. It stops casual brute-forcing but an attacker who clears cookies or switches browsers resets their own counter. This matches the explicitly requested "simple" rate limit for a single-admin, low-value-target portfolio site, without adding Redis or a database.

- [ ] **Step 5: Commit**

```bash
git add utils/loginRateLimit.js utils/__tests__/loginRateLimit.test.js package.json package-lock.json
git commit -m "feat: add cookie-based login lockout after 5 failed attempts"
```

### Task 9: Login and logout API routes

**Files:**
- Create: `pages/api/admin/login.js`, `pages/api/admin/logout.js`
- Modify: `package.json` (add `bcryptjs`)

**Interfaces:**
- Consumes: `withSessionApi` (Task 7), `isLocked`/`lockRemainingMs`/`registerFailedAttempt`/`clearAttempts` (Task 8).
- Produces: `POST /api/admin/login` (body `{email, password}` → `200 {ok:true}` | `401 {error}` | `429 {error, retryAfterSeconds}`), `POST /api/admin/logout` (→ `200 {ok:true}`), both consumed by `pages/admin/login.js` (Task 10) and `AdminLayout.js` (Task 16).

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
```

- [ ] **Step 2: Write the failing test**

Create `pages/api/admin/__tests__/login.test.js`:

```js
/** @jest-environment node */
const httpMocks = require("node-mocks-http");
const bcrypt = require("bcryptjs");

beforeAll(() => {
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters-long";
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("correct-password", 10);
});

test("rejects wrong password with 401", async () => {
  const handler = require("../login").default;
  const req = httpMocks.createRequest({
    method: "POST",
    body: { email: "admin@example.com", password: "wrong-password" },
    cookies: {},
  });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(401);
});

test("accepts correct credentials and sets a session cookie", async () => {
  const handler = require("../login").default;
  const req = httpMocks.createRequest({
    method: "POST",
    body: { email: "admin@example.com", password: "correct-password" },
    cookies: {},
  });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.getHeader("Set-Cookie")).toBeDefined();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest pages/api/admin/__tests__/login.test.js`
Expected: FAIL with `Cannot find module '../login'`.

- [ ] **Step 4: Write the routes**

Create `pages/api/admin/login.js`:

```js
import bcrypt from "bcryptjs";
import { withSessionApi } from "../../../utils/session";
import { isLocked, lockRemainingMs, registerFailedAttempt, clearAttempts } from "../../../utils/loginRateLimit";

export default withSessionApi(async function login(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (isLocked(req)) {
    res.status(429).json({ error: "locked", retryAfterSeconds: Math.ceil(lockRemainingMs(req) / 1000) });
    return;
  }

  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminPasswordHash) {
    res.status(500).json({ error: "admin_not_configured" });
    return;
  }

  const emailMatches = typeof email === "string" && email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatches = typeof password === "string" && (await bcrypt.compare(password, adminPasswordHash));

  if (!emailMatches || !passwordMatches) {
    registerFailedAttempt(req, res);
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  clearAttempts(req, res);
  req.session.admin = { email: adminEmail, loginAt: Date.now() };
  await req.session.save();
  res.status(200).json({ ok: true });
});
```

Create `pages/api/admin/logout.js`:

```js
import { withSessionApi } from "../../../utils/session";

export default withSessionApi(async function logout(req, res) {
  req.session.destroy();
  res.status(200).json({ ok: true });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest pages/api/admin/__tests__/login.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add pages/api/admin/login.js pages/api/admin/logout.js pages/api/admin/__tests__/login.test.js package.json package-lock.json
git commit -m "feat: add admin login/logout API routes with bcrypt and rate limiting"
```

### Task 10: Admin login page

**Files:**
- Create: `pages/admin/login.js`

**Interfaces:**
- Consumes: `POST /api/admin/login` (Task 9).

- [ ] **Step 1: Write the page**

Create `pages/admin/login.js`:

```js
import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError("Terlalu banyak percobaan. Coba lagi dalam " + json.retryAfterSeconds + " detik.");
        } else {
          setError("Email atau password salah.");
        }
        return;
      }
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm border border-white/10 rounded-2xl p-8 bg-white/[0.02]">
        <h1 className="text-lg font-bold text-white mb-6 font-mono">Admin Login</h1>
        <div className="mb-4">
          <label className="block text-xs font-mono text-zinc-500 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-400/60"
          />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-mono text-zinc-500 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-400/60"
          />
        </div>
        {error && <p className="text-xs text-rose-400 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 disabled:opacity-40"
        >
          {busy ? "Memproses..." : "Login"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

```bash
npm run dev
```

Visit `http://localhost:3000/admin/login`, submit wrong credentials 5 times, confirm the 6th attempt shows the lockout message; then wait or clear cookies and confirm correct credentials redirect to `/admin`.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/login.js
git commit -m "feat: add admin login page"
```

---

## Phase 3: Publish infrastructure (client image processing, GitHub commit, local dev writer)

### Task 11: Browser-side image validation and WebP processing

**Files:**
- Create: `utils/imageProcessing.js`

**Interfaces:**
- Produces: `validateImageFile(file) -> string|null`, `processImageToWebp(file, opts?) -> Promise<{thumbBlob, fullBlob}>`, `blobToBase64(blob) -> Promise<string>`, `publicUrlToRepoPath(url) -> string` — `blobToBase64` is consumed by `components/admin/AdminDraftContext.js` (Task 17); `publicUrlToRepoPath` is consumed by `components/admin/ImageUploadField.js` (Task 20), `pages/admin/projects/index.js` (Task 24), and `pages/admin/settings.js` (Task 32).

`publicUrlToRepoPath` exists because **`data/portfolio.json` only ever stores browser-servable public URLs** (e.g. `/images/projects/field-sales-crm/cover.webp`), never repo-relative paths — those are an internal detail of the publish step (`utils/github.js`/`utils/localPublish.js` both expect `uploads[].path`/`deletes[]` as repo-relative, e.g. `public/images/projects/field-sales-crm/cover.webp`). Every place that needs to queue a delete for a URL already sitting in the draft (Task 20, Task 24, Task 32) converts through this one function instead of re-deriving the `public/` prefix by hand.

- [ ] **Step 1: Write the failing test (pure-logic part only)**

Create `utils/__tests__/imageProcessing.test.js`:

```js
/**
 * @jest-environment jsdom
 */
const { validateImageFile } = require("../imageProcessing");

function makeFile({ type, size }) {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], "photo.jpg", { type });
}

test("rejects a disallowed file type", () => {
  const file = makeFile({ type: "image/gif", size: 1000 });
  expect(validateImageFile(file)).toMatch(/jpg, png, atau webp/);
});

test("rejects a file over 10MB", () => {
  const file = makeFile({ type: "image/jpeg", size: 11 * 1024 * 1024 });
  expect(validateImageFile(file)).toMatch(/10MB/);
});

test("accepts a valid jpeg under the size limit", () => {
  const file = makeFile({ type: "image/jpeg", size: 2 * 1024 * 1024 });
  expect(validateImageFile(file)).toBeNull();
});
```

Also add, in the same file, a test for the pure path-converter:

```js
const { publicUrlToRepoPath } = require("../imageProcessing");

test("publicUrlToRepoPath prefixes the public path with public/", () => {
  expect(publicUrlToRepoPath("/images/projects/field-sales-crm/cover.webp")).toBe(
    "public/images/projects/field-sales-crm/cover.webp"
  );
});
```

Note: only `validateImageFile` and `publicUrlToRepoPath` (pure logic) are unit tested here. `processImageToWebp` depends on `createImageBitmap` and `canvas.toBlob`, which jsdom does not implement; that pipeline is verified manually in a real browser as part of Task 42's QA checklist instead of faked out with heavy mocks.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/__tests__/imageProcessing.test.js`
Expected: FAIL with `Cannot find module '../imageProcessing'`.

- [ ] **Step 3: Write the module**

Create `utils/imageProcessing.js`:

```js
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Tipe file harus jpg, png, atau webp.";
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return "Ukuran file maksimal 10MB.";
  }
  return null;
}

function resizeToCanvas(bitmap, maxWidth) {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("webp_conversion_failed"))),
      "image/webp",
      quality
    );
  });
}

export async function processImageToWebp(file, options) {
  const opts = options || {};
  const thumbWidth = opts.thumbWidth || 600;
  const fullWidth = opts.fullWidth || 1600;
  const quality = opts.quality || 0.8;

  const bitmap = await createImageBitmap(file);
  const thumbCanvas = resizeToCanvas(bitmap, thumbWidth);
  const fullCanvas = resizeToCanvas(bitmap, fullWidth);
  const [thumbBlob, fullBlob] = await Promise.all([
    canvasToWebpBlob(thumbCanvas, quality),
    canvasToWebpBlob(fullCanvas, quality),
  ]);
  return { thumbBlob, fullBlob };
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function publicUrlToRepoPath(url) {
  return "public" + url;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/__tests__/imageProcessing.test.js`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/imageProcessing.js utils/__tests__/imageProcessing.test.js
git commit -m "feat: add browser-side image validation and thumb/full WebP conversion"
```

### Task 12: GitHub Git Data API publish wrapper

**Files:**
- Create: `utils/github.js`
- Modify: `package.json` (add `@octokit/rest`)

**Interfaces:**
- Produces: `getPortfolioSnapshot() -> Promise<{portfolio, baseSha}>`, `publishToGithub({portfolioJson, uploads, deletes, expectedBaseSha}) -> Promise<{commitSha}>` (throws an `Error` with `.code === "CONFLICT"` on sha mismatch) — consumed by `pages/api/admin/data.js` (Task 14) and `pages/api/admin/publish.js` (Task 15).

- [ ] **Step 1: Install @octokit/rest**

```bash
npm install @octokit/rest
```

- [ ] **Step 2: Write the failing test**

Create `utils/__tests__/github.test.js`:

```js
/** @jest-environment node */
jest.mock("@octokit/rest");
const { Octokit } = require("@octokit/rest");

beforeAll(() => {
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_OWNER = "test-owner";
  process.env.GITHUB_REPO = "test-repo";
  process.env.GITHUB_BRANCH = "main";
});

function mockOctokit(overrides) {
  const impl = Object.assign(
    {
      rest: {
        git: {
          getRef: jest.fn().mockResolvedValue({ data: { object: { sha: "current-sha" } } }),
          getCommit: jest.fn().mockResolvedValue({ data: { tree: { sha: "tree-sha" } } }),
          createBlob: jest.fn().mockResolvedValue({ data: { sha: "blob-sha" } }),
          createTree: jest.fn().mockResolvedValue({ data: { sha: "new-tree-sha" } }),
          createCommit: jest.fn().mockResolvedValue({ data: { sha: "new-commit-sha" } }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
        repos: {
          getContent: jest.fn().mockResolvedValue({
            data: { content: Buffer.from('{"name":"test"}').toString("base64") },
          }),
        },
      },
    },
    overrides
  );
  Octokit.mockImplementation(() => impl);
  return impl;
}

test("getPortfolioSnapshot returns parsed JSON and ref sha", async () => {
  mockOctokit();
  const { getPortfolioSnapshot } = require("../github");
  const result = await getPortfolioSnapshot();
  expect(result.baseSha).toBe("current-sha");
  expect(result.portfolio).toEqual({ name: "test" });
});

test("publishToGithub throws CONFLICT when ref sha has moved", async () => {
  mockOctokit();
  const { publishToGithub } = require("../github");
  await expect(
    publishToGithub({ portfolioJson: { name: "x" }, uploads: [], deletes: [], expectedBaseSha: "stale-sha" })
  ).rejects.toMatchObject({ code: "CONFLICT" });
});

test("publishToGithub builds a tree with sha:null entries for deletes", async () => {
  const impl = mockOctokit();
  const { publishToGithub } = require("../github");
  await publishToGithub({
    portfolioJson: { name: "x" },
    uploads: [{ path: "public/images/projects/a/cover.webp", base64: "abc" }],
    deletes: ["public/images/projects/a/old.webp"],
    expectedBaseSha: "current-sha",
  });

  const treeArg = impl.rest.git.createTree.mock.calls[0][0];
  const deleteEntry = treeArg.tree.find((entry) => entry.path === "public/images/projects/a/old.webp");
  expect(deleteEntry.sha).toBeNull();
  const addEntry = treeArg.tree.find((entry) => entry.path === "public/images/projects/a/cover.webp");
  expect(addEntry.sha).toBe("blob-sha");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest utils/__tests__/github.test.js`
Expected: FAIL with `Cannot find module '../github'`.

- [ ] **Step 4: Write the module**

Create `utils/github.js`:

```js
import { Octokit } from "@octokit/rest";

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

function repoParams() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
  };
}

function branchName() {
  return process.env.GITHUB_BRANCH || "main";
}

export async function getPortfolioSnapshot() {
  const octokit = getOctokit();
  const branch = branchName();
  const params = repoParams();

  const { data: refData } = await octokit.rest.git.getRef({ ...params, ref: "heads/" + branch });
  const baseSha = refData.object.sha;

  const { data: fileData } = await octokit.rest.repos.getContent({
    ...params,
    path: "data/portfolio.json",
    ref: branch,
  });

  const content = Buffer.from(fileData.content, "base64").toString("utf-8");
  return { portfolio: JSON.parse(content), baseSha };
}

export async function publishToGithub({ portfolioJson, uploads, deletes, expectedBaseSha }) {
  const octokit = getOctokit();
  const branch = branchName();
  const params = repoParams();

  const { data: refData } = await octokit.rest.git.getRef({ ...params, ref: "heads/" + branch });
  const currentSha = refData.object.sha;

  if (currentSha !== expectedBaseSha) {
    const conflictError = new Error("conflict");
    conflictError.code = "CONFLICT";
    throw conflictError;
  }

  const { data: commitData } = await octokit.rest.git.getCommit({ ...params, commit_sha: currentSha });
  const baseTreeSha = commitData.tree.sha;

  const portfolioBlob = await octokit.rest.git.createBlob({
    ...params,
    content: Buffer.from(JSON.stringify(portfolioJson, null, 2) + "\n", "utf-8").toString("base64"),
    encoding: "base64",
  });

  const treeEntries = [
    { path: "data/portfolio.json", mode: "100644", type: "blob", sha: portfolioBlob.data.sha },
  ];

  for (const upload of uploads) {
    const blob = await octokit.rest.git.createBlob({ ...params, content: upload.base64, encoding: "base64" });
    treeEntries.push({ path: upload.path, mode: "100644", type: "blob", sha: blob.data.sha });
  }

  for (const filePath of deletes) {
    treeEntries.push({ path: filePath, mode: "100644", type: "blob", sha: null });
  }

  const { data: newTree } = await octokit.rest.git.createTree({
    ...params,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    ...params,
    message: "content: update via admin",
    tree: newTree.sha,
    parents: [currentSha],
  });

  await octokit.rest.git.updateRef({ ...params, ref: "heads/" + branch, sha: newCommit.sha });

  return { commitSha: newCommit.sha };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest utils/__tests__/github.test.js`
Expected: PASS, all 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add utils/github.js utils/__tests__/github.test.js package.json package-lock.json
git commit -m "feat: add GitHub Git Data API publish wrapper with conflict detection"
```

### Task 13: Local dev-mode publish writer

**Files:**
- Create: `utils/localPublish.js`

**Interfaces:**
- Produces: `readPortfolioSnapshot() -> {portfolio, baseSha}`, `publishLocally({portfolioJson, uploads, deletes, expectedBaseSha}) -> {commitSha}` (throws `Error` with `.code === "CONFLICT"` on hash mismatch) — same shape as `utils/github.js` (Task 12) so `pages/api/admin/data.js` and `pages/api/admin/publish.js` can branch on `NODE_ENV` without any other code difference.

- [ ] **Step 1: Write the failing test**

Create `utils/__tests__/localPublish.test.js`:

```js
/** @jest-environment node */
const fs = require("fs");
const path = require("path");
const os = require("os");

let tmpDir;
let originalCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-test-"));
  fs.mkdirSync(path.join(tmpDir, "data"));
  fs.writeFileSync(path.join(tmpDir, "data", "portfolio.json"), JSON.stringify({ name: "before" }));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
  jest.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("readPortfolioSnapshot returns parsed json and a stable hash", () => {
  const { readPortfolioSnapshot } = require("../localPublish");
  const result = readPortfolioSnapshot();
  expect(result.portfolio).toEqual({ name: "before" });
  expect(typeof result.baseSha).toBe("string");
});

test("publishLocally writes the new json, uploads, and deletes when sha matches", () => {
  const { readPortfolioSnapshot, publishLocally } = require("../localPublish");
  const before = readPortfolioSnapshot();

  fs.mkdirSync(path.join(tmpDir, "public", "images", "projects", "a"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "public", "images", "projects", "a", "old.webp"), "old");

  publishLocally({
    portfolioJson: { name: "after" },
    uploads: [{ path: "public/images/projects/a/new.webp", base64: Buffer.from("new").toString("base64") }],
    deletes: ["public/images/projects/a/old.webp"],
    expectedBaseSha: before.baseSha,
  });

  const updated = JSON.parse(fs.readFileSync(path.join(tmpDir, "data", "portfolio.json"), "utf-8"));
  expect(updated).toEqual({ name: "after" });
  expect(fs.existsSync(path.join(tmpDir, "public", "images", "projects", "a", "old.webp"))).toBe(false);
  expect(fs.existsSync(path.join(tmpDir, "public", "images", "projects", "a", "new.webp"))).toBe(true);
});

test("publishLocally throws CONFLICT when the file changed since baseSha was read", () => {
  const { publishLocally } = require("../localPublish");
  expect(() =>
    publishLocally({ portfolioJson: { name: "after" }, uploads: [], deletes: [], expectedBaseSha: "stale-hash" })
  ).toThrow(expect.objectContaining({ code: "CONFLICT" }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/__tests__/localPublish.test.js`
Expected: FAIL with `Cannot find module '../localPublish'`.

- [ ] **Step 3: Write the module**

Create `utils/localPublish.js`:

```js
import fs from "fs";
import path from "path";
import crypto from "crypto";

function portfolioPath() {
  return path.join(process.cwd(), "data", "portfolio.json");
}

export function readPortfolioSnapshot() {
  const raw = fs.readFileSync(portfolioPath(), "utf-8");
  const baseSha = crypto.createHash("sha256").update(raw).digest("hex");
  return { portfolio: JSON.parse(raw), baseSha };
}

export function publishLocally({ portfolioJson, uploads, deletes, expectedBaseSha }) {
  const current = readPortfolioSnapshot();
  if (current.baseSha !== expectedBaseSha) {
    const conflictError = new Error("conflict");
    conflictError.code = "CONFLICT";
    throw conflictError;
  }

  for (const filePath of deletes) {
    const absolute = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  }

  for (const upload of uploads) {
    const absolute = path.join(process.cwd(), upload.path);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, Buffer.from(upload.base64, "base64"));
  }

  fs.writeFileSync(portfolioPath(), JSON.stringify(portfolioJson, null, 2) + "\n", "utf-8");

  return { commitSha: "local" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/__tests__/localPublish.test.js`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/localPublish.js utils/__tests__/localPublish.test.js
git commit -m "feat: add dev-mode local filesystem publish path"
```

### Task 14: `/api/admin/data` route

**Files:**
- Create: `pages/api/admin/data.js`

**Interfaces:**
- Consumes: `withAdminApi` (Task 7), `getPortfolioSnapshot` (Task 12), `readPortfolioSnapshot` (Task 13).
- Produces: `GET /api/admin/data -> 200 {portfolio, baseSha}` (401 if not logged in) — consumed by `components/admin/AdminDraftContext.js` (Task 17).

- [ ] **Step 1: Write the route**

Create `pages/api/admin/data.js`:

```js
import { withAdminApi } from "../../../utils/session";
import { getPortfolioSnapshot } from "../../../utils/github";
import { readPortfolioSnapshot } from "../../../utils/localPublish";

export default withAdminApi(async function data(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const snapshot =
    process.env.NODE_ENV === "development" ? readPortfolioSnapshot() : await getPortfolioSnapshot();

  res.status(200).json(snapshot);
});
```

- [ ] **Step 2: Manual verification**

With the dev server running and logged in as admin (Task 10), open `http://localhost:3000/api/admin/data` in a browser tab within the same session; without logging in first, confirm it returns `401`.

- [ ] **Step 3: Commit**

```bash
git add pages/api/admin/data.js
git commit -m "feat: add admin data endpoint returning portfolio.json plus its base sha"
```

### Task 15: `/api/admin/publish` route

**Files:**
- Create: `pages/api/admin/publish.js`

**Interfaces:**
- Consumes: `withAdminApi` (Task 7), `validatePortfolio` (Task 4), `publishToGithub` (Task 12), `publishLocally` (Task 13).
- Produces: `POST /api/admin/publish` (body `{portfolio, baseSha, uploads, deletes}` → `200 {ok, commitSha, message}` | `400 {error, details}` | `409 {error, message}` | `413 {error, message}`) — consumed by `components/admin/AdminDraftContext.js` (Task 17).

- [ ] **Step 1: Write the failing test**

Create `pages/api/admin/__tests__/publish.test.js`:

```js
/** @jest-environment node */
const httpMocks = require("node-mocks-http");

jest.mock("../../../../utils/github", () => ({
  publishToGithub: jest.fn(),
}));
jest.mock("../../../../utils/localPublish", () => ({
  publishLocally: jest.fn(() => ({ commitSha: "local" })),
}));

const { publishToGithub } = require("../../../../utils/github");
const { publishLocally } = require("../../../../utils/localPublish");

const MINIMAL_VALID_PORTFOLIO = require("../../../../utils/__tests__/fixtures/validPortfolio.json");

function requestWithSession(body) {
  const req = httpMocks.createRequest({ method: "POST", body });
  req.session = { admin: { email: "admin@example.com" } };
  return req;
}

test("rejects invalid portfolio data with 400", async () => {
  const handler = require("../publish").default;
  const req = requestWithSession({ portfolio: { name: "incomplete" }, baseSha: "x", uploads: [], deletes: [] });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(400);
});

test("rejects an oversized upload batch with 413", async () => {
  const handler = require("../publish").default;
  // The limit is measured on the base64 STRING length (what actually travels in the
  // HTTP body), not the decoded binary size - 5MB of base64 characters is unambiguously
  // over the 4MB threshold regardless of which measurement a future edit might use.
  const bigBase64 = "A".repeat(5 * 1024 * 1024);
  const req = requestWithSession({
    portfolio: MINIMAL_VALID_PORTFOLIO,
    baseSha: "x",
    uploads: [{ path: "public/images/projects/a/cover.webp", base64: bigBase64 }],
    deletes: [],
  });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(413);
});

test("calls publishLocally in development and returns 200", async () => {
  process.env.NODE_ENV = "development";
  const handler = require("../publish").default;
  const req = requestWithSession({ portfolio: MINIMAL_VALID_PORTFOLIO, baseSha: "x", uploads: [], deletes: [] });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(publishLocally).toHaveBeenCalled();
  expect(res.statusCode).toBe(200);
});

test("returns 409 when the publish path reports a conflict", async () => {
  process.env.NODE_ENV = "production";
  publishToGithub.mockImplementation(() => {
    const err = new Error("conflict");
    err.code = "CONFLICT";
    throw err;
  });
  const handler = require("../publish").default;
  const req = requestWithSession({ portfolio: MINIMAL_VALID_PORTFOLIO, baseSha: "stale", uploads: [], deletes: [] });
  const res = httpMocks.createResponse();
  await handler(req, res);
  expect(res.statusCode).toBe(409);
  process.env.NODE_ENV = "test";
});
```

Create the shared fixture file `utils/__tests__/fixtures/validPortfolio.json` with the same content as `validFixture` from Task 4's `portfolioSchema.test.js` (copy that object as JSON so both tests share one canonical valid document instead of drifting apart).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest pages/api/admin/__tests__/publish.test.js`
Expected: FAIL with `Cannot find module '../publish'`.

- [ ] **Step 3: Write the route**

Create `pages/api/admin/publish.js`:

```js
import { withAdminApi } from "../../../utils/session";
import { validatePortfolio } from "../../../utils/portfolioSchema";
import { publishToGithub } from "../../../utils/github";
import { publishLocally } from "../../../utils/localPublish";

// Measured on the base64 STRING length, not the decoded binary size - that string is
// what actually makes up the HTTP request body Vercel's serverless functions cap at
// 4.5MB total, so this must reflect the wire size, not the smaller pre-encoding size.
const MAX_BATCH_BYTES = 4 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" },
  },
};

export default withAdminApi(async function publish(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const portfolio = body.portfolio;
  const baseSha = body.baseSha;
  const uploads = body.uploads || [];
  const deletes = body.deletes || [];

  const validation = validatePortfolio(portfolio);
  if (!validation.success) {
    res.status(400).json({ error: "invalid_data", details: validation.errors });
    return;
  }

  const totalBytes = uploads.reduce((sum, upload) => sum + upload.base64.length, 0);
  if (totalBytes > MAX_BATCH_BYTES) {
    res.status(413).json({
      error: "batch_too_large",
      message: "Total ukuran gambar baru melebihi 4 MB. Kurangi jumlah gambar atau publish bertahap.",
    });
    return;
  }

  try {
    const result =
      process.env.NODE_ENV === "development"
        ? publishLocally({ portfolioJson: validation.data, uploads, deletes, expectedBaseSha: baseSha })
        : await publishToGithub({ portfolioJson: validation.data, uploads, deletes, expectedBaseSha: baseSha });

    res.status(200).json({
      ok: true,
      commitSha: result.commitSha,
      message:
        process.env.NODE_ENV === "development"
          ? "Tersimpan secara lokal."
          : "Deploy sedang berjalan, tayang dalam 1 sampai 2 menit.",
    });
  } catch (error) {
    if (error.code === "CONFLICT") {
      res.status(409).json({ error: "conflict", message: "Data telah berubah, silakan reload." });
      return;
    }
    res.status(500).json({ error: "publish_failed", message: error.message });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest pages/api/admin/__tests__/publish.test.js`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add pages/api/admin/publish.js pages/api/admin/__tests__/publish.test.js utils/__tests__/fixtures/validPortfolio.json
git commit -m "feat: add admin publish endpoint with validation, size guard, and conflict handling"
```

---

## Phase 4: Admin draft state and shared UI shell

### Task 16: Install @dnd-kit and wire `AdminDraftProvider` into `_app.js`

**Files:**
- Modify: `pages/_app.js`
- Modify: `package.json` (add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)

**Interfaces:**
- Consumes: `AdminDraftProvider` (Task 17, written next — this task wires it in first so Task 17's provider has somewhere to mount for manual verification).

- [ ] **Step 1: Install dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Update `pages/_app.js`**

Replace its contents with:

```js
import "../styles/globals.css";
import { useRouter } from "next/router";
import { LanguageProvider } from "../context/LanguageContext";
import { AdminDraftProvider } from "../components/admin/AdminDraftContext";

const App = ({ Component, pageProps }) => {
  const router = useRouter();
  const isAdminApp = router.pathname.startsWith("/admin") && router.pathname !== "/admin/login";

  if (isAdminApp) {
    return (
      <AdminDraftProvider>
        <Component {...pageProps} />
      </AdminDraftProvider>
    );
  }

  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
};

export default App;
```

This keeps `AdminDraftProvider` mounted across every `/admin/*` page navigation (Next's Pages Router never remounts `_app`, only `Component`), so unsaved draft edits survive switching between admin menu pages and are only lost on a full reload or by navigating out of `/admin` and back in — an intentional, safe default. `/admin/login` is deliberately excluded since it needs no draft state and no session exists yet.

- [ ] **Step 3: Commit**

```bash
git add pages/_app.js package.json package-lock.json
git commit -m "feat: mount AdminDraftProvider across all admin pages via _app"
```

### Task 17: `AdminDraftContext` — the client-side draft state

**Files:**
- Create: `components/admin/AdminDraftContext.js`

**Interfaces:**
- Consumes: `blobToBase64` (Task 11).
- Produces: `AdminDraftProvider`, `useAdminDraft() -> { portfolio, loading, error, updatePortfolio, addPendingUpload, addPendingDelete, pendingUploads, pendingDeletes, isDirty, publish, publishing, publishMessage, reload }` — consumed by every `pages/admin/*.js` page (Tasks 21-32), `PublishBar.js` (Task 18), `ImageUploadField.js` (Task 20).

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/AdminDraftContext.test.js`:

```js
import { render, screen, waitFor, act } from "@testing-library/react";
import { AdminDraftProvider, useAdminDraft } from "../AdminDraftContext";

function Probe() {
  const { portfolio, loading, updatePortfolio, isDirty } = useAdminDraft();
  if (loading || !portfolio) return <div>loading</div>;
  return (
    <div>
      <span data-testid="name">{portfolio.name}</span>
      <span data-testid="dirty">{isDirty ? "dirty" : "clean"}</span>
      <button onClick={() => updatePortfolio((prev) => ({ ...prev, name: "changed" }))}>edit</button>
    </div>
  );
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ portfolio: { name: "original" }, baseSha: "sha-1" }),
  });
});

test("loads the portfolio and baseSha on mount", async () => {
  render(
    <AdminDraftProvider>
      <Probe />
    </AdminDraftProvider>
  );
  await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("original"));
  expect(screen.getByTestId("dirty")).toHaveTextContent("clean");
});

test("updatePortfolio marks the draft dirty", async () => {
  render(
    <AdminDraftProvider>
      <Probe />
    </AdminDraftProvider>
  );
  await waitFor(() => screen.getByTestId("name"));
  act(() => {
    screen.getByText("edit").click();
  });
  await waitFor(() => expect(screen.getByTestId("dirty")).toHaveTextContent("dirty"));
  expect(screen.getByTestId("name")).toHaveTextContent("changed");
});

function ProbeWithUpload() {
  const { portfolio, loading, addPendingUpload, publish, publishMessage } = useAdminDraft();
  if (loading || !portfolio) return <div>loading</div>;
  return (
    <div>
      <span data-testid="message">{publishMessage ? publishMessage.text : ""}</span>
      <button
        onClick={() => {
          // ~6MB raw blob -> base64 encodes to well over the 4MB client-side guard,
          // so this never even reaches fetch("/api/admin/publish").
          const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)]);
          addPendingUpload("public/images/projects/a/cover.webp", bigBlob);
        }}
      >
        stage-big-upload
      </button>
      <button onClick={publish}>publish</button>
    </div>
  );
}

test("publish refuses an oversized pending-upload batch before calling fetch", async () => {
  render(
    <AdminDraftProvider>
      <ProbeWithUpload />
    </AdminDraftProvider>
  );
  await waitFor(() => screen.getByText("publish"));
  const fetchCallsBefore = global.fetch.mock.calls.length;

  act(() => {
    screen.getByText("stage-big-upload").click();
  });
  await act(async () => {
    screen.getByText("publish").click();
  });

  await waitFor(() => expect(screen.getByTestId("message")).toHaveTextContent(/4 ?MB/));
  // Only the initial /api/admin/data load happened - publish() bailed out before fetching.
  expect(global.fetch.mock.calls.length).toBe(fetchCallsBefore);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/admin/__tests__/AdminDraftContext.test.js`
Expected: FAIL with `Cannot find module '../AdminDraftContext'`.

- [ ] **Step 3: Write the module**

Create `components/admin/AdminDraftContext.js`:

```js
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { blobToBase64 } from "../../utils/imageProcessing";

const AdminDraftContext = createContext(null);

// Mirrors the server-side MAX_BATCH_BYTES in pages/api/admin/publish.js (Task 15) - kept
// as a literal here rather than imported, since that file is server-only and this module
// ships to the browser. Measured on the base64 STRING length (the actual request body
// size), not the smaller decoded binary size.
const MAX_BATCH_BYTES = 4 * 1024 * 1024;

export function AdminDraftProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [baseSha, setBaseSha] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data");
      if (!res.ok) throw new Error("load_failed");
      const json = await res.json();
      setPortfolio(json.portfolio);
      setBaseSha(json.baseSha);
      setPendingUploads([]);
      setPendingDeletes([]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePortfolio = useCallback((updater) => {
    setPortfolio((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...next, __touched: true };
    });
  }, []);

  const addPendingUpload = useCallback((uploadPath, blob) => {
    const previewUrl = URL.createObjectURL(blob);
    setPendingUploads((prev) => [...prev.filter((u) => u.path !== uploadPath), { path: uploadPath, blob, previewUrl }]);
    return previewUrl;
  }, []);

  const addPendingDelete = useCallback((deletePath) => {
    if (!deletePath) return;
    setPendingDeletes((prev) => (prev.includes(deletePath) ? prev : [...prev, deletePath]));
    setPendingUploads((prev) => prev.filter((u) => u.path !== deletePath));
  }, []);

  const isDirty =
    pendingUploads.length > 0 || pendingDeletes.length > 0 || Boolean(portfolio && portfolio.__touched);

  const publish = useCallback(async () => {
    if (!portfolio) return;
    setPublishing(true);
    setPublishMessage(null);
    try {
      const uploadsPayload = await Promise.all(
        pendingUploads.map(async (upload) => ({ path: upload.path, base64: await blobToBase64(upload.blob) }))
      );

      const totalBase64Bytes = uploadsPayload.reduce((sum, upload) => sum + upload.base64.length, 0);
      if (totalBase64Bytes > MAX_BATCH_BYTES) {
        setPublishMessage({
          type: "error",
          text: "Total ukuran gambar baru melebihi 4 MB. Kurangi jumlah gambar atau publish bertahap.",
        });
        return;
      }

      const { __touched, ...cleanPortfolio } = portfolio;

      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio: cleanPortfolio,
          baseSha,
          uploads: uploadsPayload,
          deletes: pendingDeletes,
        }),
      });

      const json = await res.json();

      if (res.status === 409) {
        setPublishMessage({ type: "conflict", text: json.message });
        return;
      }
      if (!res.ok) {
        setPublishMessage({ type: "error", text: json.message || "Publish gagal." });
        return;
      }

      setPublishMessage({ type: "success", text: json.message });
      await load();
    } catch (publishError) {
      setPublishMessage({ type: "error", text: publishError.message });
    } finally {
      setPublishing(false);
    }
  }, [portfolio, baseSha, pendingUploads, pendingDeletes, load]);

  const value = useMemo(
    () => ({
      portfolio,
      loading,
      error,
      updatePortfolio,
      addPendingUpload,
      addPendingDelete,
      pendingUploads,
      pendingDeletes,
      isDirty,
      publish,
      publishing,
      publishMessage,
      reload: load,
    }),
    [
      portfolio,
      loading,
      error,
      updatePortfolio,
      addPendingUpload,
      addPendingDelete,
      pendingUploads,
      pendingDeletes,
      isDirty,
      publish,
      publishing,
      publishMessage,
      load,
    ]
  );

  return <AdminDraftContext.Provider value={value}>{children}</AdminDraftContext.Provider>;
}

export function useAdminDraft() {
  const ctx = useContext(AdminDraftContext);
  if (!ctx) throw new Error("useAdminDraft must be used within AdminDraftProvider");
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/admin/__tests__/AdminDraftContext.test.js`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminDraftContext.js components/admin/__tests__/AdminDraftContext.test.js
git commit -m "feat: add AdminDraftContext holding the client-side content draft and publish flow with a client-side size guard"
```

### Task 18: Shared form primitives — `PublishBar`, `ConfirmDialog`, `LocaleTabs`, `FormField`

**Files:**
- Create: `components/admin/PublishBar.js`, `components/admin/ConfirmDialog.js`, `components/admin/LocaleTabs.js`, `components/admin/FormField.js`

**Interfaces:**
- Consumes: `useAdminDraft` (Task 17).
- Produces: `<PublishBar/>`, `<ConfirmDialog open title description onConfirm onCancel/>`, `<LocaleTabs renderEn renderId/>`, `<FormField label>children</FormField>`, `<TextInput/>`, `<TextArea/>` — consumed by every admin page (Tasks 21-32).

- [ ] **Step 1: Write PublishBar**

Create `components/admin/PublishBar.js`:

```js
import { useAdminDraft } from "./AdminDraftContext";

export default function PublishBar() {
  const { isDirty, publish, publishing, publishMessage, pendingUploads, pendingDeletes } = useAdminDraft();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur px-6 py-4 flex items-center justify-between z-40">
      <div className="text-sm text-zinc-400 font-mono">
        {isDirty
          ? pendingUploads.length + " gambar baru, " + pendingDeletes.length + " dihapus, perubahan belum dipublish."
          : "Tidak ada perubahan."}
        {publishMessage && (
          <span className={"ml-3 " + (publishMessage.type === "success" ? "text-brand-400" : "text-rose-400")}>
            {publishMessage.text}
          </span>
        )}
      </div>
      <button
        onClick={publish}
        disabled={!isDirty || publishing}
        className="text-sm px-6 py-2.5 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-300 transition-all"
      >
        {publishing ? "Mempublish..." : "Publish"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write ConfirmDialog**

Create `components/admin/ConfirmDialog.js`:

```js
export default function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5">
            Batal
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-rose-500 text-white hover:bg-rose-600">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write LocaleTabs**

Create `components/admin/LocaleTabs.js`:

```js
import { useState } from "react";

export default function LocaleTabs({ renderEn, renderId }) {
  const [tab, setTab] = useState("en");
  return (
    <div>
      <div className="flex gap-1 mb-3 border border-white/10 rounded-lg p-1 w-fit font-mono text-xs">
        <button
          onClick={() => setTab("en")}
          className={"px-3 py-1.5 rounded " + (tab === "en" ? "bg-brand-400 text-zinc-950 font-bold" : "text-zinc-400")}
        >
          EN
        </button>
        <button
          onClick={() => setTab("id")}
          className={"px-3 py-1.5 rounded " + (tab === "id" ? "bg-brand-400 text-zinc-950 font-bold" : "text-zinc-400")}
        >
          ID
        </button>
      </div>
      {tab === "en" ? renderEn() : renderId()}
    </div>
  );
}
```

- [ ] **Step 4: Write FormField**

Create `components/admin/FormField.js`:

```js
export default function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-brand-400/60 outline-none"
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-brand-400/60 outline-none min-h-[120px]"
    />
  );
}
```

- [ ] **Step 5: Smoke test ConfirmDialog (representative of this batch)**

Create `components/admin/__tests__/ConfirmDialog.test.js`:

```js
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../ConfirmDialog";

test("renders nothing when closed", () => {
  const { container } = render(<ConfirmDialog open={false} title="t" description="d" onConfirm={() => {}} onCancel={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test("calls onConfirm when the delete button is clicked", () => {
  const onConfirm = jest.fn();
  render(<ConfirmDialog open title="Hapus?" description="d" onConfirm={onConfirm} onCancel={() => {}} />);
  fireEvent.click(screen.getByText("Hapus"));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 6: Run and verify pass**

Run: `npx jest components/admin/__tests__/ConfirmDialog.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/admin/PublishBar.js components/admin/ConfirmDialog.js components/admin/LocaleTabs.js components/admin/FormField.js components/admin/__tests__/ConfirmDialog.test.js
git commit -m "feat: add shared admin form primitives (PublishBar, ConfirmDialog, LocaleTabs, FormField)"
```

### Task 19: `SortableList` drag-and-drop reorder

**Files:**
- Create: `components/admin/SortableList.js`

**Interfaces:**
- Produces: `<SortableList items getId onReorder renderItem/>` — consumed by `pages/admin/status-card.js`, `projects/index.js`, `services.js`, `how-it-works.js`, `tech-stack.js`, `contact-social.js` (Tasks 23-31).

- [ ] **Step 1: Write the module**

Create `components/admin/SortableList.js`:

```js
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button {...attributes} {...listeners} className="mt-3 cursor-grab text-zinc-500 hover:text-zinc-300 touch-none" aria-label="Drag to reorder" type="button">
        ⠿
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function SortableList({ items, getId, onReorder, renderItem }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => getId(item) === active.id);
    const newIndex = items.findIndex((item) => getId(item) === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)}>
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 2: Write a reorder-logic test**

Create `components/admin/__tests__/SortableList.test.js`:

```js
import { render, screen } from "@testing-library/react";
import SortableList from "../SortableList";

test("renders one row per item via renderItem", () => {
  const items = [{ id: "a", label: "First" }, { id: "b", label: "Second" }];
  render(
    <SortableList
      items={items}
      getId={(item) => item.id}
      onReorder={() => {}}
      renderItem={(item) => <span>{item.label}</span>}
    />
  );
  expect(screen.getByText("First")).toBeInTheDocument();
  expect(screen.getByText("Second")).toBeInTheDocument();
});
```

(Full pointer-drag simulation is not practical under jsdom; the actual drag interaction is covered manually in Task 42's QA checklist. This test only locks in that every item renders through the provided `renderItem`.)

- [ ] **Step 3: Run and verify pass**

Run: `npx jest components/admin/__tests__/SortableList.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/admin/SortableList.js components/admin/__tests__/SortableList.test.js
git commit -m "feat: add drag-and-drop SortableList for admin reorderable lists"
```

### Task 20: `ImageUploadField`

**Files:**
- Create: `components/admin/ImageUploadField.js`

**Interfaces:**
- Consumes: `validateImageFile`, `processImageToWebp`, `publicUrlToRepoPath` (Task 11), `useAdminDraft` (Task 17).
- Produces: `<ImageUploadField label value publicUrlThumb publicUrlFull disabled disabledReason onUploaded onRemoved/>` — consumed by `pages/admin/projects/[id].js` (Task 25) for the project thumbnail and each gallery image, and `pages/admin/settings.js` (Task 32) for favicon/OG image.

This component owns **all** path bookkeeping internally, so no caller ever has to know or construct a `public/`-prefixed repo path:
- `value` is the field's currently *persisted* public URL (e.g. `project.thumbnailThumb`, or `null` if none) — what to show as the preview after a page reload, once the file genuinely exists at that URL.
- `publicUrlThumb`/`publicUrlFull` are the **deterministic target public URLs** the caller has already decided this image will live at (e.g. `/images/projects/{slug}/cover-thumb.webp`) — computed from data already in scope (a project's `slug`, or a fixed constant like `/favicon.webp`), never from `Date.now()` or anything regenerated on re-render.
- On upload, the component resizes/converts the file, stages both blobs via `addPendingUpload(publicUrlToRepoPath(...), blob)`, keeps its own local `URL.createObjectURL` preview for this browser session only (never written to the draft), and calls `onUploaded(publicUrlThumb, publicUrlFull)` so the caller can set its own JSON field(s) to those same URLs — the ones that will actually resolve once Publish lands.
- On remove, it stages both deletes via `addPendingDelete(publicUrlToRepoPath(...))` and calls `onRemoved()` so the caller can null out its field(s). No caller manages `addPendingUpload`/`addPendingDelete` itself for images.
- `disabled`/`disabledReason` let a caller block uploads until a precondition is met (Task 25 uses this to require a non-empty project slug before any image can be attached, since the target paths are slug-derived).

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/ImageUploadField.test.js`:

```js
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AdminDraftProvider, useAdminDraft } from "../AdminDraftContext";
import ImageUploadField from "../ImageUploadField";

function PendingCountProbe() {
  const { pendingUploads, pendingDeletes } = useAdminDraft();
  return (
    <div>
      <span data-testid="uploads">{pendingUploads.length}</span>
      <span data-testid="deletes">{pendingDeletes.length}</span>
    </div>
  );
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ portfolio: { name: "x" }, baseSha: "sha-1" }),
  });
});

test("shows the disabled reason and no upload control when disabled", async () => {
  render(
    <AdminDraftProvider>
      <ImageUploadField
        label="Thumbnail"
        value={null}
        publicUrlThumb="/images/projects/x/cover-thumb.webp"
        publicUrlFull="/images/projects/x/cover.webp"
        disabled
        disabledReason="Isi slug terlebih dahulu."
        onUploaded={() => {}}
        onRemoved={() => {}}
      />
    </AdminDraftProvider>
  );
  await waitFor(() => screen.getByText("Isi slug terlebih dahulu."));
  expect(screen.queryByText("Upload gambar")).not.toBeInTheDocument();
});

test("removing an existing image stages two deletes and calls onRemoved", async () => {
  const onRemoved = jest.fn();
  render(
    <AdminDraftProvider>
      <PendingCountProbe />
      <ImageUploadField
        label="Thumbnail"
        value="/images/projects/x/cover-thumb.webp"
        publicUrlThumb="/images/projects/x/cover-thumb.webp"
        publicUrlFull="/images/projects/x/cover.webp"
        onUploaded={() => {}}
        onRemoved={onRemoved}
      />
    </AdminDraftProvider>
  );
  await waitFor(() => screen.getByText("Hapus", { exact: false }));
  act(() => {
    fireEvent.click(screen.getByText("Hapus"));
  });
  expect(onRemoved).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.getByTestId("deletes")).toHaveTextContent("2"));
});
```

Note: the upload-and-convert path (`processImageToWebp`) needs `createImageBitmap`/`canvas.toBlob`, unavailable in jsdom (same boundary already documented in Task 11) — it is exercised manually in Task 25's QA step, not faked out with heavy mocks here. These two tests cover the disabled-gating and delete-staging logic, which are pure DOM/state behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/admin/__tests__/ImageUploadField.test.js`
Expected: FAIL with `Cannot find module '../ImageUploadField'`.

- [ ] **Step 3: Write the module**

Create `components/admin/ImageUploadField.js`:

```js
import { useRef, useState } from "react";
import { processImageToWebp, validateImageFile, publicUrlToRepoPath } from "../../utils/imageProcessing";
import { useAdminDraft } from "./AdminDraftContext";

export default function ImageUploadField({
  label,
  value,
  publicUrlThumb,
  publicUrlFull,
  disabled,
  disabledReason,
  onUploaded,
  onRemoved,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const { addPendingUpload, addPendingDelete } = useAdminDraft();

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { thumbBlob, fullBlob } = await processImageToWebp(file);
      addPendingUpload(publicUrlToRepoPath(publicUrlThumb), thumbBlob);
      addPendingUpload(publicUrlToRepoPath(publicUrlFull), fullBlob);
      setLocalPreview(URL.createObjectURL(thumbBlob));
      onUploaded(publicUrlThumb, publicUrlFull);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    addPendingDelete(publicUrlToRepoPath(publicUrlThumb));
    addPendingDelete(publicUrlToRepoPath(publicUrlFull));
    setLocalPreview(null);
    onRemoved();
  };

  const previewSrc = localPreview || value;

  if (disabled) {
    return (
      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
        <p className="text-xs text-zinc-600 italic">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
      {previewSrc ? (
        <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-white/10 group">
          <img src={previewSrc} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            type="button"
            className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Hapus
          </button>
        </div>
      ) : (
        <label className="w-40 h-28 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-xs text-zinc-500 cursor-pointer hover:border-brand-400/40">
          {busy ? "Memproses..." : "Upload gambar"}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </label>
      )}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/admin/__tests__/ImageUploadField.test.js`
Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ImageUploadField.js components/admin/__tests__/ImageUploadField.test.js
git commit -m "feat: add ImageUploadField storing public URLs in the draft, converting to repo paths only for staging"
```

### Task 21: `AdminLayout` shell and protected `/admin` index redirect

**Files:**
- Create: `components/admin/AdminLayout.js`, `pages/admin/index.js`

**Interfaces:**
- Consumes: `withAdminSsr` (Task 7).
- Produces: `<AdminLayout title previewHref>children</AdminLayout>` — consumed by every `pages/admin/*.js` page (Tasks 22-32).

- [ ] **Step 1: Write AdminLayout**

Create `components/admin/AdminLayout.js`:

```js
import Link from "next/link";
import { useRouter } from "next/router";

const MENU = [
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/status-card", label: "Status Card" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/how-it-works", label: "How I Work" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/tech-stack", label: "Tech Stack" },
  { href: "/admin/contact-social", label: "Contact & Social" },
  { href: "/admin/cta", label: "CTA" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ title, children, previewHref }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <aside className="w-56 border-r border-white/10 p-4 flex flex-col gap-1 font-mono text-sm">
        <h1 className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">Admin</h1>
        {MENU.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={
                "px-3 py-2 rounded-lg " +
                (router.pathname.startsWith(item.href) ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5")
              }
            >
              {item.label}
            </a>
          </Link>
        ))}
        <button onClick={logout} type="button" className="mt-auto px-3 py-2 rounded-lg text-left text-rose-400 hover:bg-white/5">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40"
            >
              Preview ↗
            </a>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write the protected `/admin` redirect**

Create `pages/admin/index.js`:

```js
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr(async () => ({
  redirect: { destination: "/admin/hero", permanent: false },
}));

export default function AdminIndex() {
  return null;
}
```

- [ ] **Step 3: Manual verification**

With the dev server running, visit `/admin` while logged out; confirm redirect to `/admin/login`. Log in, visit `/admin` again; confirm redirect to `/admin/hero`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminLayout.js pages/admin/index.js
git commit -m "feat: add admin layout shell with menu sidebar and protected index redirect"
```

---

## Phase 5: Admin menu pages (B2.1 through B2.10)

Every page in this phase follows the same shape: `getServerSideProps = withAdminSsr()` guards the route, the component reads `portfolio`/`loading` from `useAdminDraft()`, mutates via `updatePortfolio`, and renders `<PublishBar/>` at the end. A shared `set(path, value)` helper (deep-set by key array, via `structuredClone`) is repeated in each page rather than extracted into a hook, since each page's mutation shapes differ enough (arrays vs nested objects) that a generic helper would need almost as much per-call code as writing the update inline — consistent with the plan's YAGNI stance on premature abstraction.

### Task 22: Hero admin page (B2.1)

**Files:**
- Create: `pages/admin/hero.js`

**Interfaces:**
- Consumes: `AdminLayout` (Task 21), `LocaleTabs`, `FormField`/`TextInput`/`TextArea` (Task 18), `useAdminDraft` (Task 17), `PublishBar` (Task 18).

- [ ] **Step 1: Write the page**

Create `pages/admin/hero.js`:

```js
import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

function setDeep(portfolio, keyPath, value) {
  const next = structuredClone(portfolio);
  let target = next;
  for (let i = 0; i < keyPath.length - 1; i++) target = target[keyPath[i]];
  target[keyPath[keyPath.length - 1]] = value;
  return next;
}

export default function HeroAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Hero">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const set = (keyPath, value) => updatePortfolio((prev) => setDeep(prev, keyPath, value));

  const updateButton = (index, field, value) => {
    const buttons = portfolio.heroButtons.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn));
    set(["heroButtons"], buttons);
  };

  return (
    <AdminLayout title="Hero" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Badge text">
              <TextInput value={portfolio.headerTaglineOne.en} onChange={(e) => set(["headerTaglineOne", "en"], e.target.value)} />
            </FormField>
            <FormField label="Headline">
              <TextInput value={portfolio.headerTaglineTwo.en} onChange={(e) => set(["headerTaglineTwo", "en"], e.target.value)} />
            </FormField>
            <FormField label="Sub-headline (kalimat lengkap, salah satu kata rotasi di bawah akan di-highlight biru)">
              <TextInput value={portfolio.headerTaglineThree.en} onChange={(e) => set(["headerTaglineThree", "en"], e.target.value)} />
            </FormField>
            <FormField label="Kata rotasi (pisahkan dengan koma)">
              <TextInput
                value={portfolio.headerTaglineThreeRotations.en.join(", ")}
                onChange={(e) => set(["headerTaglineThreeRotations", "en"], e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </FormField>
            <FormField label="Deskripsi">
              <TextArea value={portfolio.headerTaglineFour.en} onChange={(e) => set(["headerTaglineFour", "en"], e.target.value)} />
            </FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Teks badge">
              <TextInput value={portfolio.headerTaglineOne.id} onChange={(e) => set(["headerTaglineOne", "id"], e.target.value)} />
            </FormField>
            <FormField label="Headline">
              <TextInput value={portfolio.headerTaglineTwo.id} onChange={(e) => set(["headerTaglineTwo", "id"], e.target.value)} />
            </FormField>
            <FormField label="Sub-headline (kalimat lengkap)">
              <TextInput value={portfolio.headerTaglineThree.id} onChange={(e) => set(["headerTaglineThree", "id"], e.target.value)} />
            </FormField>
            <FormField label="Kata rotasi (pisahkan dengan koma)">
              <TextInput
                value={portfolio.headerTaglineThreeRotations.id.join(", ")}
                onChange={(e) => set(["headerTaglineThreeRotations", "id"], e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </FormField>
            <FormField label="Deskripsi">
              <TextArea value={portfolio.headerTaglineFour.id} onChange={(e) => set(["headerTaglineFour", "id"], e.target.value)} />
            </FormField>
          </>
        )}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Tombol Hero</h3>
      {portfolio.heroButtons.map((btn, idx) => (
        <div key={btn.id} className="grid grid-cols-3 gap-3 mb-3">
          <TextInput placeholder="Label EN" value={btn.labelEn} onChange={(e) => updateButton(idx, "labelEn", e.target.value)} />
          <TextInput placeholder="Label ID" value={btn.labelId} onChange={(e) => updateButton(idx, "labelId", e.target.value)} />
          <TextInput placeholder="Link (href)" value={btn.href} onChange={(e) => updateButton(idx, "href", e.target.value)} />
        </div>
      ))}

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Log in, visit `/admin/hero`, edit the EN headline, confirm the field updates and the bottom bar switches to "1 gambar baru, 0 dihapus..." — no wait, it should show "0 gambar baru, 0 dihapus, perubahan belum dipublish." (dirty because of the text edit, not an image). Click Publish in dev mode; confirm `data/portfolio.json` on disk is rewritten with the new headline and `npm run dev`'s homepage reflects it after a refresh.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/hero.js
git commit -m "feat: add Hero admin page"
```

### Task 23: Status Card admin page (B2.2)

**Files:**
- Create: `pages/admin/status-card.js`

**Interfaces:**
- Consumes: `AdminLayout`, `SortableList` (Task 19), `FormField`/`TextInput`, `ConfirmDialog` (Task 18), `useAdminDraft`, `PublishBar`.

- [ ] **Step 1: Write the page**

Create `pages/admin/status-card.js`:

```js
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

const STATUS_OPTIONS = [
  { value: "active", label: "Active / Aktif" },
  { value: "in_progress", label: "In Progress / Sedang Berjalan" },
  { value: "open", label: "Open / Terbuka" },
];

export default function StatusCardAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Status Card">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateItem = (id, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      statusCard: prev.statusCard.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    const newId = String(Date.now());
    updatePortfolio((prev) => ({
      ...prev,
      statusCard: [...prev.statusCard, { id: newId, labelEn: "New item", labelId: "Item baru", status: "open" }],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, statusCard: prev.statusCard.filter((item) => item.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, statusCard: reordered }));

  return (
    <AdminLayout title="Status Card" previewHref="/">
      <SortableList
        items={portfolio.statusCard}
        getId={(item) => item.id}
        onReorder={reorder}
        renderItem={(item) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Label EN">
                <TextInput value={item.labelEn} onChange={(e) => updateItem(item.id, "labelEn", e.target.value)} />
              </FormField>
              <FormField label="Label ID">
                <TextInput value={item.labelId} onChange={(e) => updateItem(item.id, "labelId", e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-between">
              <select
                value={item.status}
                onChange={(e) => updateItem(item.id, "status", e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button onClick={() => setDeleteTarget(item.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah item +
      </button>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus item status?"
        description="Item ini akan dihapus dari status card di halaman utama."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Add an item, reorder items by drag, delete one with confirmation, publish in dev mode, confirm the homepage status card reflects the new order/content.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/status-card.js
git commit -m "feat: add Status Card admin page with drag reorder and delete confirmation"
```

### Task 24: Projects list admin page (B2.3, part 1)

**Files:**
- Create: `pages/admin/projects/index.js`

**Interfaces:**
- Consumes: `AdminLayout`, `SortableList`, `ConfirmDialog`, `useAdminDraft`, `PublishBar`.
- Produces: navigation to `pages/admin/projects/[id].js` (Task 25) via `router.push("/admin/projects/" + project.id)` and `router.push("/admin/projects/new")`.

- [ ] **Step 1: Write the page**

Create `pages/admin/projects/index.js`:

```js
import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/admin/AdminLayout";
import SortableList from "../../../components/admin/SortableList";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import PublishBar from "../../../components/admin/PublishBar";
import { useAdminDraft } from "../../../components/admin/AdminDraftContext";
import { publicUrlToRepoPath } from "../../../utils/imageProcessing";
import { withAdminSsr } from "../../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ProjectsListAdminPage() {
  const { portfolio, updatePortfolio, loading, addPendingDelete } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Projects">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, projects: reordered }));

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
    }));
  };

  const confirmDelete = () => {
    const project = portfolio.projects.find((p) => p.id === deleteTarget);
    if (project) {
      // portfolio.json only ever stores public URLs (e.g. /images/projects/x/cover.webp);
      // addPendingDelete stages repo-relative paths for utils/github.js and utils/localPublish.js,
      // so every URL is converted through publicUrlToRepoPath right before staging.
      if (project.thumbnail) addPendingDelete(publicUrlToRepoPath(project.thumbnail));
      if (project.thumbnailThumb) addPendingDelete(publicUrlToRepoPath(project.thumbnailThumb));
      project.gallery.forEach((image) => {
        if (image.src) addPendingDelete(publicUrlToRepoPath(image.src));
        if (image.thumbSrc) addPendingDelete(publicUrlToRepoPath(image.thumbSrc));
      });
    }
    updatePortfolio((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  return (
    <AdminLayout title="Projects">
      <button
        onClick={() => router.push("/admin/projects/new")}
        type="button"
        className="mb-6 text-sm px-4 py-2 rounded-lg bg-brand-400 text-zinc-950 font-bold"
      >
        Tambah project +
      </button>

      <SortableList
        items={portfolio.projects}
        getId={(project) => project.id}
        onReorder={reorder}
        renderItem={(project) => (
          <div className="border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{project.title.en}</p>
              <p className="text-xs text-zinc-500 font-mono">/projects/{project.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => togglePublished(project.id)}
                type="button"
                className={
                  "text-xs px-3 py-1.5 rounded-lg font-mono " +
                  (project.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")
                }
              >
                {project.published ? "Published" : "Draft"}
              </button>
              <a
                href={"/projects/" + project.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-white"
              >
                Preview
              </a>
              <button
                onClick={() => router.push("/admin/projects/" + project.id)}
                type="button"
                className="text-xs text-zinc-300 hover:text-white"
              >
                Edit
              </button>
              <button onClick={() => setDeleteTarget(project.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus project?"
        description="Project dan semua gambar galerinya akan dihapus saat publish berikutnya."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PublishBar />
    </AdminLayout>
  );
}
```

Note: the "Preview" link here always points at the live public path (`/projects/{slug}`), which only resolves if the project is already published (matches the plain SSG lookup built in Task 34 — an unpublished draft 404s there). Full preview-of-drafts is out of scope for this plan; deleting a draft project simply removes it without ever having had a public URL.

- [ ] **Step 2: Manual verification**

Create a project via "Tambah project +", confirm it lands on the edit page (Task 25); reorder existing projects by drag; toggle Published/Draft; delete one and confirm its gallery images get queued in `pendingDeletes` (visible in the `PublishBar`'s "N dihapus" count).

- [ ] **Step 3: Commit**

```bash
git add pages/admin/projects/index.js
git commit -m "feat: add Projects list admin page with reorder, publish toggle, and delete"
```

### Task 25: Project create/edit admin page (B2.3, part 2)

**Files:**
- Create: `pages/admin/projects/[id].js`

**Interfaces:**
- Consumes: `AdminLayout`, `LocaleTabs`, `FormField`/`TextInput`/`TextArea`, `SortableList`, `ImageUploadField` (Task 20), `useAdminDraft`, `PublishBar`.

This page fixes three bugs from an earlier draft of this plan, all worth calling out explicitly since they're easy to reintroduce by accident:
1. **New-project creation must not call `updatePortfolio` during render.** Mutating state as a side effect of rendering (rather than in an event handler or `useEffect`) is undefined behavior under React 18 (can double-fire under Strict Mode, breaks concurrent rendering assumptions). This page creates the draft project inside a `useEffect`.
2. **Image paths are slug-derived**, so uploading before a slug exists has nowhere stable to point at. The thumbnail and every gallery slot's `ImageUploadField` are `disabled` with an explanatory message until `project.slug` is non-empty. If the slug is edited *after* images already exist, a warning banner appears (this plan does not attempt to auto-move already-staged files to a new path — that would require re-uploading blobs already sitting in browser memory under a new key, which is more complex than it's worth for what is fundamentally a "finish naming your project before you attach files" workflow nudge).
3. **Every gallery slot's target path is stable across re-renders.** A gallery image's id is generated once, when "Tambah gambar galeri" is clicked (creating an empty gallery entry), never recomputed from `Date.now()` inside JSX on every render.

- [ ] **Step 1: Write the page**

Create `pages/admin/projects/[id].js`:

```js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/admin/AdminLayout";
import LocaleTabs from "../../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../../components/admin/FormField";
import SortableList from "../../../components/admin/SortableList";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import PublishBar from "../../../components/admin/PublishBar";
import { useAdminDraft } from "../../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../../utils/session";

export const getServerSideProps = withAdminSsr();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyProject(id) {
  return {
    id, slug: "", path: "", title: { en: "", id: "" }, description: { en: "", id: "" },
    thumbnail: null, thumbnailThumb: null, gallery: [],
    role: { en: "", id: "" }, duration: "", problem: { en: "", id: "" }, solution: { en: "", id: "" },
    features: { en: [], id: [] }, impact: { en: [], id: [] }, tags: [],
    link: [], featured: false, published: false, order: 999,
  };
}

export default function ProjectEditAdminPage() {
  const router = useRouter();
  const { id } = router.query;
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugChangedAfterImages, setSlugChangedAfterImages] = useState(false);

  const isNew = id === "new";
  const existing = !loading && portfolio && !isNew ? portfolio.projects.find((p) => p.id === id) : null;

  // Side effect belongs in useEffect, not the render body: creating the draft project
  // and redirecting is a one-time action gated on isNew + not-yet-created, never something
  // that should run (or re-run) purely because this component happened to render again.
  useEffect(() => {
    if (!loading && portfolio && isNew && !portfolio.__draftNewProjectId) {
      const newId = String(Date.now());
      updatePortfolio((prev) => ({
        ...prev,
        __draftNewProjectId: newId,
        projects: [...prev.projects, emptyProject(newId)],
      }));
      router.replace("/admin/projects/" + newId);
    }
  }, [loading, portfolio, isNew, updatePortfolio, router]);

  if (loading || !portfolio || !id) {
    return (
      <AdminLayout title="Project">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  if (!isNew && !existing) {
    return (
      <AdminLayout title="Project">
        <p className="text-rose-400 text-sm">Project tidak ditemukan.</p>
      </AdminLayout>
    );
  }

  const project = existing || (portfolio.__draftNewProjectId && portfolio.projects.find((p) => p.id === portfolio.__draftNewProjectId));
  if (!project) {
    return (
      <AdminLayout title="Project">
        <p className="text-zinc-500 text-sm">Menyiapkan project baru...</p>
      </AdminLayout>
    );
  }

  const hasImages = Boolean(project.thumbnail) || project.gallery.length > 0;
  const slugMissing = project.slug.trim() === "";

  const updateField = (field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === project.id ? { ...p, [field]: value } : p)),
    }));
  };

  const updateBilingualField = (field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === project.id ? { ...p, [field]: { ...p[field], [lang]: value } } : p)),
    }));
  };

  const updateListField = (field, lang, value) => {
    const items = value.split("\n").map((s) => s.trim()).filter(Boolean);
    updateBilingualField(field, lang, items);
  };

  const updateTitle = (lang, value) => {
    updateBilingualField("title", lang, value);
    if (lang === "en" && !slugTouched) {
      updateField("slug", slugify(value));
    }
  };

  const updateSlug = (value) => {
    setSlugTouched(true);
    if (hasImages && value !== project.slug) {
      setSlugChangedAfterImages(true);
    }
    updateField("slug", value);
  };

  const updateLink = (index, field, value) => {
    const links = project.link.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    updateField("link", links);
  };

  const setLinkAt = (label, url) => {
    const existingIndex = project.link.findIndex((l) => l.label === label);
    if (existingIndex === -1) {
      if (url) updateField("link", [...project.link, { label, url }]);
      return;
    }
    if (!url) {
      updateField("link", project.link.filter((_, i) => i !== existingIndex));
      return;
    }
    updateLink(existingIndex, "url", url);
  };

  const getLinkValue = (label) => {
    const found = project.link.find((l) => l.label === label);
    return found ? found.url : "";
  };

  const thumbUrlThumb = "/images/projects/" + project.slug + "/cover-thumb.webp";
  const thumbUrlFull = "/images/projects/" + project.slug + "/cover.webp";

  const addGalleryPlaceholder = () => {
    const newImage = {
      id: "img-" + Date.now(),
      src: null,
      thumbSrc: null,
      captionEn: "",
      captionId: "",
      order: project.gallery.length,
    };
    updateField("gallery", [...project.gallery, newImage]);
  };

  const updateGalleryImageUrls = (imageId, thumbUrl, fullUrl) => {
    updateField(
      "gallery",
      project.gallery.map((img) => (img.id === imageId ? { ...img, thumbSrc: thumbUrl, src: fullUrl } : img))
    );
  };

  const updateGalleryCaption = (imageId, lang, value) => {
    const field = lang === "en" ? "captionEn" : "captionId";
    updateField(
      "gallery",
      project.gallery.map((img) => (img.id === imageId ? { ...img, [field]: value } : img))
    );
  };

  const removeGalleryItem = (imageId) => {
    updateField("gallery", project.gallery.filter((img) => img.id !== imageId));
  };

  const reorderGallery = (reordered) => updateField("gallery", reordered);

  return (
    <AdminLayout title={isNew ? "Project baru" : project.title.en || "Project"} previewHref={project.published ? "/projects/" + project.slug : undefined}>
      <FormField label="Slug (URL, bisa diedit manual)">
        <TextInput value={project.slug} onChange={(e) => updateSlug(e.target.value)} />
      </FormField>
      {slugChangedAfterImages && (
        <p className="text-xs text-amber-400 mb-4">
          Slug diubah setelah project sudah punya gambar. Gambar yang sudah diupload sebelumnya mengacu ke path slug
          lama dan bisa jadi broken link setelah publish. Hapus dan upload ulang thumbnail/galeri sekarang slug sudah
          final.
        </p>
      )}

      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Title"><TextInput value={project.title.en} onChange={(e) => updateTitle("en", e.target.value)} /></FormField>
            <FormField label="Short description"><TextArea value={project.description.en} onChange={(e) => updateBilingualField("description", "en", e.target.value)} /></FormField>
            <FormField label="Role saya"><TextInput value={project.role.en} onChange={(e) => updateBilingualField("role", "en", e.target.value)} /></FormField>
            <FormField label="Problem"><TextArea value={project.problem.en} onChange={(e) => updateBilingualField("problem", "en", e.target.value)} /></FormField>
            <FormField label="Solution"><TextArea value={project.solution.en} onChange={(e) => updateBilingualField("solution", "en", e.target.value)} /></FormField>
            <FormField label="Key features (satu per baris)"><TextArea value={project.features.en.join("\n")} onChange={(e) => updateListField("features", "en", e.target.value)} /></FormField>
            <FormField label="Impact (1-3 poin, satu per baris)"><TextArea value={project.impact.en.join("\n")} onChange={(e) => updateListField("impact", "en", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Title"><TextInput value={project.title.id} onChange={(e) => updateTitle("id", e.target.value)} /></FormField>
            <FormField label="Deskripsi singkat"><TextArea value={project.description.id} onChange={(e) => updateBilingualField("description", "id", e.target.value)} /></FormField>
            <FormField label="Role saya"><TextInput value={project.role.id} onChange={(e) => updateBilingualField("role", "id", e.target.value)} /></FormField>
            <FormField label="Problem"><TextArea value={project.problem.id} onChange={(e) => updateBilingualField("problem", "id", e.target.value)} /></FormField>
            <FormField label="Solution"><TextArea value={project.solution.id} onChange={(e) => updateBilingualField("solution", "id", e.target.value)} /></FormField>
            <FormField label="Key features (satu per baris)"><TextArea value={project.features.id.join("\n")} onChange={(e) => updateListField("features", "id", e.target.value)} /></FormField>
            <FormField label="Impact (1-3 poin, satu per baris)"><TextArea value={project.impact.id.join("\n")} onChange={(e) => updateListField("impact", "id", e.target.value)} /></FormField>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Durasi / tahun"><TextInput value={project.duration} onChange={(e) => updateField("duration", e.target.value)} /></FormField>
        <FormField label="Path label (opsional, cth: ~/mysales)"><TextInput value={project.path} onChange={(e) => updateField("path", e.target.value)} /></FormField>
      </div>

      <FormField label="Tech stack tags (pisahkan dengan koma)">
        <TextInput
          value={project.tags.join(", ")}
          onChange={(e) => updateField("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      </FormField>

      <h3 className="text-sm font-mono text-zinc-400 mt-6 mb-3">Links</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FormField label="Live URL"><TextInput value={getLinkValue("Live")} onChange={(e) => setLinkAt("Live", e.target.value)} /></FormField>
        <FormField label="GitHub Frontend"><TextInput value={getLinkValue("Frontend")} onChange={(e) => setLinkAt("Frontend", e.target.value)} /></FormField>
        <FormField label="GitHub Backend"><TextInput value={getLinkValue("Backend")} onChange={(e) => setLinkAt("Backend", e.target.value)} /></FormField>
        <FormField label="GitHub Mobile"><TextInput value={getLinkValue("Mobile")} onChange={(e) => setLinkAt("Mobile", e.target.value)} /></FormField>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={project.featured} onChange={(e) => updateField("featured", e.target.checked)} />
          Featured (tampil lebar di grid)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={project.published} onChange={(e) => updateField("published", e.target.checked)} />
          Published
        </label>
      </div>

      <h3 className="text-sm font-mono text-zinc-400 mb-3">Thumbnail</h3>
      <ImageUploadField
        label="Thumbnail card"
        value={project.thumbnailThumb}
        publicUrlThumb={thumbUrlThumb}
        publicUrlFull={thumbUrlFull}
        disabled={slugMissing}
        disabledReason="Isi slug terlebih dahulu sebelum upload thumbnail."
        onUploaded={(thumbUrl, fullUrl) => {
          updateField("thumbnailThumb", thumbUrl);
          updateField("thumbnail", fullUrl);
        }}
        onRemoved={() => {
          updateField("thumbnail", null);
          updateField("thumbnailThumb", null);
        }}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Galeri</h3>
      <SortableList
        items={project.gallery}
        getId={(image) => image.id}
        onReorder={reorderGallery}
        renderItem={(image) => (
          <div className="border border-white/10 rounded-xl p-4 flex gap-4">
            <ImageUploadField
              label="Gambar"
              value={image.thumbSrc}
              publicUrlThumb={"/images/projects/" + project.slug + "/" + image.id + "-thumb.webp"}
              publicUrlFull={"/images/projects/" + project.slug + "/" + image.id + ".webp"}
              disabled={slugMissing}
              disabledReason="Isi slug terlebih dahulu sebelum upload gambar galeri."
              onUploaded={(thumbUrl, fullUrl) => updateGalleryImageUrls(image.id, thumbUrl, fullUrl)}
              onRemoved={() => removeGalleryItem(image.id)}
            />
            <div className="flex-1 grid grid-cols-2 gap-3 self-start">
              <TextInput placeholder="Caption EN" value={image.captionEn} onChange={(e) => updateGalleryCaption(image.id, "en", e.target.value)} />
              <TextInput placeholder="Caption ID" value={image.captionId} onChange={(e) => updateGalleryCaption(image.id, "id", e.target.value)} />
            </div>
          </div>
        )}
      />
      <button
        onClick={addGalleryPlaceholder}
        type="button"
        disabled={slugMissing}
        className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {slugMissing ? "Isi slug dulu untuk menambah gambar" : "+ Tambah gambar galeri"}
      </button>

      <PublishBar />
    </AdminLayout>
  );
}
```

Individual gallery images are removed via `ImageUploadField`'s own hover-to-reveal "Hapus" button (which already stages both file deletes and calls `onRemoved`, wired here to `removeGalleryItem`) rather than a separate confirm-dialog-gated button — since nothing is actually deleted from Git/disk until the admin presses the top-level Publish button anyway, removing a staged draft image is trivially reversible (just re-add it) and doesn't warrant its own confirmation step. The `ConfirmDialog` in this file is kept only as a hook for a future whole-gallery-clear action; it renders but nothing currently opens it (`deleteImageTarget` never gets set) — remove it in a follow-up if it stays unused after Task 43's QA pass confirms it's genuinely dead.

- [ ] **Step 2: Manual verification**

Create a new project through the list page; confirm it does **not** flash a React "Cannot update a component while rendering a different component" warning in the console (verifying the `useEffect` fix); confirm the slug auto-derives from the English title until manually edited; confirm the thumbnail and "Tambah gambar galeri" button are disabled with an explanatory message while slug is empty, and become usable the moment a slug exists; upload a thumbnail and 2 gallery images; edit the slug after uploading and confirm the amber warning appears; reorder gallery images by drag; remove one gallery image via its own hover "Hapus" button and confirm the `PublishBar`'s delete count increments; fill Problem/Solution/Features/Impact in both languages; toggle Published; Publish in dev mode; confirm `public/images/projects/{slug}/` now contains the WebP files at their public-URL-derived names and `data/portfolio.json`'s `thumbnail`/`thumbnailThumb`/gallery `src`/`thumbSrc` fields all hold public URLs (leading `/images/...`, never `public/images/...`).

- [ ] **Step 3: Commit**

```bash
git add "pages/admin/projects/[id].js"
git commit -m "feat: add project create/edit admin page with gallery manager, slug-gated uploads, and useEffect-based project creation"
```

### Task 26: Services admin page (B2.4)

**Files:**
- Create: `pages/admin/services.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/services.js`:

```js
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ServicesAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Services">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateItem = (id, field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === id ? { ...s, [field]: { ...s[field], [lang]: value } } : s
      ),
    }));
  };

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, published: !s.published } : s)),
    }));
  };

  const addItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { id: String(Date.now()), title: { en: "", id: "" }, description: { en: "", id: "" }, published: true, order: prev.services.length },
      ],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, services: reordered }));

  return (
    <AdminLayout title="Services" previewHref="/">
      <SortableList
        items={portfolio.services}
        getId={(s) => s.id}
        onReorder={reorder}
        renderItem={(service) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Title EN"><TextInput value={service.title.en} onChange={(e) => updateItem(service.id, "title", "en", e.target.value)} /></FormField>
              <FormField label="Title ID"><TextInput value={service.title.id} onChange={(e) => updateItem(service.id, "title", "id", e.target.value)} /></FormField>
              <FormField label="Description EN"><TextArea value={service.description.en} onChange={(e) => updateItem(service.id, "description", "en", e.target.value)} /></FormField>
              <FormField label="Description ID"><TextArea value={service.description.id} onChange={(e) => updateItem(service.id, "description", "id", e.target.value)} /></FormField>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => togglePublished(service.id)}
                type="button"
                className={"text-xs px-3 py-1.5 rounded-lg font-mono " + (service.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")}
              >
                {service.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => setDeleteTarget(service.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah service +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus service?" description="Service ini akan hilang dari halaman utama." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Confirm the 6 seeded services (including the 2 new ones from Task 6) appear, reorder works, adding/deleting/publishing-toggle works, and the homepage Services grid reflects changes after a dev-mode publish.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/services.js
git commit -m "feat: add Services admin page"
```

### Task 27: How I Work admin page (B2.5)

**Files:**
- Create: `pages/admin/how-it-works.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/how-it-works.js`:

```js
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function HowItWorkAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="How I Work">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateSectionField = (field, lang, value) => {
    updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, [field]: { ...prev.howIWork[field], [lang]: value } } }));
  };

  const updateStep = (id, field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      howIWork: {
        ...prev.howIWork,
        steps: prev.howIWork.steps.map((s) => (s.id === id ? { ...s, [field]: { ...s[field], [lang]: value } } : s)),
      },
    }));
  };

  const addStep = () => {
    updatePortfolio((prev) => ({
      ...prev,
      howIWork: {
        ...prev.howIWork,
        steps: [...prev.howIWork.steps, { id: String(Date.now()), title: { en: "", id: "" }, description: { en: "", id: "" }, order: prev.howIWork.steps.length }],
      },
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, steps: prev.howIWork.steps.filter((s) => s.id !== deleteTarget) } }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, steps: reordered } }));

  return (
    <AdminLayout title="How I Work" previewHref="/">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FormField label="Judul EN"><TextInput value={portfolio.howIWork.title.en} onChange={(e) => updateSectionField("title", "en", e.target.value)} /></FormField>
        <FormField label="Judul ID"><TextInput value={portfolio.howIWork.title.id} onChange={(e) => updateSectionField("title", "id", e.target.value)} /></FormField>
        <FormField label="Deskripsi EN"><TextArea value={portfolio.howIWork.description.en} onChange={(e) => updateSectionField("description", "en", e.target.value)} /></FormField>
        <FormField label="Deskripsi ID"><TextArea value={portfolio.howIWork.description.id} onChange={(e) => updateSectionField("description", "id", e.target.value)} /></FormField>
      </div>

      <h3 className="text-sm font-mono text-zinc-400 mb-3">Langkah-langkah (nomor otomatis dari urutan)</h3>
      <SortableList
        items={portfolio.howIWork.steps}
        getId={(step) => step.id}
        onReorder={reorder}
        renderItem={(step, index) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <p className="text-xs font-mono text-brand-400 mb-2">Step {String(index + 1).padStart(2, "0")}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Title EN"><TextInput value={step.title.en} onChange={(e) => updateStep(step.id, "title", "en", e.target.value)} /></FormField>
              <FormField label="Title ID"><TextInput value={step.title.id} onChange={(e) => updateStep(step.id, "title", "id", e.target.value)} /></FormField>
              <FormField label="Description EN"><TextArea value={step.description.en} onChange={(e) => updateStep(step.id, "description", "en", e.target.value)} /></FormField>
              <FormField label="Description ID"><TextArea value={step.description.id} onChange={(e) => updateStep(step.id, "description", "id", e.target.value)} /></FormField>
            </div>
            <button onClick={() => setDeleteTarget(step.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
              Hapus
            </button>
          </div>
        )}
      />

      <button onClick={addStep} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah step +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus step?" description="Step ini akan hilang dari section How I Work." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Confirm the 7 seeded steps appear in order, reordering renumbers the displayed "Step 0X" badges correctly, add/delete work, and the homepage's new How I Work section (built in Task 35) reflects changes.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/how-it-works.js
git commit -m "feat: add How I Work admin page"
```

---

### Task 28: About admin page (B2.6)

**Files:**
- Create: `pages/admin/about.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/about.js`:

```js
import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function AboutAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="About">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateAboutPara = (lang, value) => {
    updatePortfolio((prev) => ({ ...prev, aboutpara: { ...prev.aboutpara, [lang]: value } }));
  };

  return (
    <AdminLayout title="About" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <FormField label="Teks about (EN)">
            <TextArea value={portfolio.aboutpara.en} onChange={(e) => updateAboutPara("en", e.target.value)} />
          </FormField>
        )}
        renderId={() => (
          <FormField label="Teks about (ID)">
            <TextArea value={portfolio.aboutpara.id} onChange={(e) => updateAboutPara("id", e.target.value)} />
          </FormField>
        )}
      />

      <p className="text-xs text-zinc-500 mt-2">
        Catatan: field info kampus dan info pekerjaan yang terstruktur (`resume.education`, `resume.experiences`) sengaja
        dikosongkan saat migrasi karena datanya template lama yang salah, dan tidak ada halaman publik yang membacanya
        setelah pembersihan dead code di Task 3. Jika nanti dibutuhkan halaman resume terstruktur, field tersebut sudah
        tersedia di <code>data/portfolio.json</code> dan bisa diberi menu admin baru di luar plan ini.
      </p>

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Edit the About paragraph in both languages, publish in dev mode, confirm the homepage About section reflects the change.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/about.js
git commit -m "feat: add About admin page"
```

### Task 29: Tech Stack admin page (B2.7)

**Files:**
- Create: `pages/admin/tech-stack.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/tech-stack.js`:

```js
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function TechStackAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Tech Stack">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateCategoryName = (categoryId, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, name: { ...cat.name, [lang]: value } } : cat
        ),
      },
    }));
  };

  const reorderCategories = (reordered) => {
    updatePortfolio((prev) => ({ ...prev, techstack: { ...prev.techstack, categories: reordered } }));
  };

  const addCategory = () => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: [
          ...prev.techstack.categories,
          { id: String(Date.now()), name: { en: "", id: "" }, order: prev.techstack.categories.length, items: [] },
        ],
      },
    }));
  };

  const updateItem = (categoryId, itemId, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) }
            : cat
        ),
      },
    }));
  };

  const addItem = (categoryId) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: [...cat.items, { id: String(Date.now()), name: "", level: "familiar" }] }
            : cat
        ),
      },
    }));
  };

  const confirmDeleteItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => item.id !== deleteTarget),
        })),
      },
    }));
    setDeleteTarget(null);
  };

  return (
    <AdminLayout title="Tech Stack" previewHref="/">
      <SortableList
        items={portfolio.techstack.categories}
        getId={(cat) => cat.id}
        onReorder={reorderCategories}
        renderItem={(category) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FormField label="Nama kategori EN">
                <TextInput value={category.name.en} onChange={(e) => updateCategoryName(category.id, "en", e.target.value)} />
              </FormField>
              <FormField label="Nama kategori ID">
                <TextInput value={category.name.id} onChange={(e) => updateCategoryName(category.id, "id", e.target.value)} />
              </FormField>
            </div>

            {category.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 mb-2">
                <TextInput
                  value={item.name}
                  onChange={(e) => updateItem(category.id, item.id, "name", e.target.value)}
                  className="flex-1"
                />
                <select
                  value={item.level}
                  onChange={(e) => updateItem(category.id, item.id, "level", e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
                >
                  <option value="main">Main</option>
                  <option value="familiar">Familiar</option>
                </select>
                <button onClick={() => setDeleteTarget(item.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                  Hapus
                </button>
              </div>
            ))}

            <button onClick={() => addItem(category.id)} type="button" className="mt-2 text-xs text-zinc-400 hover:text-white">
              + Tambah item
            </button>
          </div>
        )}
      />

      <button onClick={addCategory} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah kategori +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus item tech stack?" description="Item ini akan hilang dari section Tech Stack." onConfirm={confirmDeleteItem} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Confirm the 4 seeded categories and `Bootstrap`'s presence (marked Main) show correctly; toggle an item's level between Main/Familiar; add a new item/category; delete one; publish in dev mode; confirm the homepage Tech Stack section (updated in Task 35 to render Main/Familiar styling) reflects the change.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/tech-stack.js
git commit -m "feat: add Tech Stack admin page with main/familiar level toggle"
```

### Task 30: Contact & Social admin page (B2.8)

**Files:**
- Create: `pages/admin/contact-social.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/contact-social.js`:

```js
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ContactSocialAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Contact & Social">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateField = (id, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.id === id ? { ...s, published: !s.published } : s)),
    }));
  };

  const addItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: [
        ...prev.socials,
        {
          id: String(Date.now()), title: "New Platform", link: "", actionEn: "", actionId: "",
          placement: "connect_grid", published: true, order: prev.socials.length,
        },
      ],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, socials: prev.socials.filter((s) => s.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, socials: reordered }));

  return (
    <AdminLayout title="Contact & Social" previewHref="/">
      <SortableList
        items={portfolio.socials}
        getId={(s) => s.id}
        onReorder={reorder}
        renderItem={(social) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Platform / Label"><TextInput value={social.title} onChange={(e) => updateField(social.id, "title", e.target.value)} /></FormField>
              <FormField label="URL"><TextInput value={social.link} onChange={(e) => updateField(social.id, "link", e.target.value)} /></FormField>
              <FormField label="Action text EN (muncul di bawah icon, khusus Connect Grid)"><TextInput value={social.actionEn} onChange={(e) => updateField(social.id, "actionEn", e.target.value)} /></FormField>
              <FormField label="Action text ID"><TextInput value={social.actionId} onChange={(e) => updateField(social.id, "actionId", e.target.value)} /></FormField>
            </div>
            <div className="flex items-center justify-between">
              <select
                value={social.placement}
                onChange={(e) => updateField(social.id, "placement", e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
              >
                <option value="connect_grid">Tampil di grid "Let's Connect"</option>
                <option value="footer_cta">Tampil di tombol Footer CTA</option>
              </select>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePublished(social.id)}
                  type="button"
                  className={"text-xs px-3 py-1.5 rounded-lg font-mono " + (social.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")}
                >
                  {social.published ? "Tampil" : "Disembunyikan"}
                </button>
                <button onClick={() => setDeleteTarget(social.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah platform +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus platform?" description="Link ini akan hilang dari halaman utama." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
```

Note: `title` is matched case-sensitively against the `socialConfig`/`defaultSocial` lookup in `pages/index.js` (Task 35) to pick an icon and hover color; entries whose `title` does not match a known key (`Github`, `LinkedIn`, `WhatsApp`, `Email`) fall back to `defaultSocial`'s generic icon, so adding a brand-new platform (beyond the 6 seeded ones) still renders sensibly without a code change.

- [ ] **Step 2: Manual verification**

Toggle a `connect_grid` entry to `footer_cta` and confirm it moves from the "Let's Connect" grid to the Footer CTA button row after a dev-mode publish; add a brand-new platform and confirm it renders with the generic fallback icon.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/contact-social.js
git commit -m "feat: add Contact & Social admin page with placement toggle"
```

### Task 31: CTA admin page (B2.9)

**Files:**
- Create: `pages/admin/cta.js`

- [ ] **Step 1: Write the page**

Create `pages/admin/cta.js`:

```js
import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function CtaAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="CTA">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateField = (field, lang, value) => {
    updatePortfolio((prev) => ({ ...prev, footerCta: { ...prev.footerCta, [field]: { ...prev.footerCta[field], [lang]: value } } }));
  };

  return (
    <AdminLayout title="CTA" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Judul"><TextInput value={portfolio.footerCta.title.en} onChange={(e) => updateField("title", "en", e.target.value)} /></FormField>
            <FormField label="Deskripsi"><TextArea value={portfolio.footerCta.description.en} onChange={(e) => updateField("description", "en", e.target.value)} /></FormField>
            <FormField label="Label tombol Email"><TextInput value={portfolio.footerCta.emailButtonLabel.en} onChange={(e) => updateField("emailButtonLabel", "en", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Judul"><TextInput value={portfolio.footerCta.title.id} onChange={(e) => updateField("title", "id", e.target.value)} /></FormField>
            <FormField label="Deskripsi"><TextArea value={portfolio.footerCta.description.id} onChange={(e) => updateField("description", "id", e.target.value)} /></FormField>
            <FormField label="Label tombol Email"><TextInput value={portfolio.footerCta.emailButtonLabel.id} onChange={(e) => updateField("emailButtonLabel", "id", e.target.value)} /></FormField>
          </>
        )}
      />

      <p className="text-xs text-zinc-500 mt-2">
        Tombol FastWork dan Projects.co.id yang tampil di sebelah tombol Email diatur di menu Contact & Social
        (placement "Tampil di tombol Footer CTA"), bukan di sini.
      </p>

      <PublishBar />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Manual verification**

Edit the CTA title/description/email button label in both languages, publish in dev mode, confirm the Footer CTA card on the homepage reflects the change.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/cta.js
git commit -m "feat: add CTA admin page"
```

### Task 32: Settings admin page (B2.10)

**Files:**
- Create: `pages/admin/settings.js`

**Interfaces:**
- Consumes: `ImageUploadField` (Task 20) for favicon/OG image, `publicUrlToRepoPath` (Task 11) for the PDF uploader. Note: resume PDFs use their own small `PdfUploadField` defined inline below rather than `ImageUploadField`, since a PDF needs no client-side resize/WebP conversion — but it follows the exact same "component stores/reads public URLs, converts to a repo path only at the upload/delete boundary" rule as every image field.

- [ ] **Step 1: Write the page**

Create `pages/admin/settings.js`:

```js
import { useRef, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ImageUploadField from "../../components/admin/ImageUploadField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { publicUrlToRepoPath } from "../../utils/imageProcessing";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

function PdfUploadField({ label, value, targetUrl, onUploaded, onRemoved }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const { addPendingUpload, addPendingDelete } = useAdminDraft();

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("File harus berupa PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB.");
      return;
    }
    setError(null);
    addPendingUpload(publicUrlToRepoPath(targetUrl), file);
    onUploaded(targetUrl);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    if (value) addPendingDelete(publicUrlToRepoPath(value));
    onRemoved();
  };

  return (
    <FormField label={label}>
      <div className="flex items-center gap-3">
        {value ? (
          <>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 underline">
              Lihat file saat ini
            </a>
            <button onClick={handleRemove} type="button" className="text-xs text-rose-400 hover:text-rose-300">
              Hapus
            </button>
          </>
        ) : (
          <span className="text-xs text-zinc-500">Belum ada file</span>
        )}
        <label className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40 cursor-pointer">
          Upload PDF
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </FormField>
  );
}

export default function SettingsAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Settings">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateSeo = (field, value) => {
    updatePortfolio((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
  };

  const updateResumeFile = (lang, url) => {
    updatePortfolio((prev) => ({ ...prev, resumeFiles: { ...prev.resumeFiles, [lang]: url } }));
  };

  const updateFooterText = (value) => {
    updatePortfolio((prev) => ({ ...prev, footerCopyrightText: value }));
  };

  const updateShowCursor = (value) => {
    updatePortfolio((prev) => ({ ...prev, flags: { ...prev.flags, showCursor: value } }));
  };

  return (
    <AdminLayout title="Settings" previewHref="/">
      <h3 className="text-sm font-mono text-zinc-400 mb-3">SEO Global</h3>
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="SEO title"><TextInput value={portfolio.seo.titleEn} onChange={(e) => updateSeo("titleEn", e.target.value)} /></FormField>
            <FormField label="SEO description"><TextArea value={portfolio.seo.descriptionEn} onChange={(e) => updateSeo("descriptionEn", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="SEO title"><TextInput value={portfolio.seo.titleId} onChange={(e) => updateSeo("titleId", e.target.value)} /></FormField>
            <FormField label="SEO description"><TextArea value={portfolio.seo.descriptionId} onChange={(e) => updateSeo("descriptionId", e.target.value)} /></FormField>
          </>
        )}
      />
      <FormField label="Keywords (pisahkan dengan koma)">
        <TextInput value={portfolio.seo.keywords} onChange={(e) => updateSeo("keywords", e.target.value)} />
      </FormField>
      <FormField label="Canonical URL">
        <TextInput value={portfolio.seo.canonicalUrl} onChange={(e) => updateSeo("canonicalUrl", e.target.value)} />
      </FormField>

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Favicon & OG Image</h3>
      <div className="grid grid-cols-2 gap-6">
        <ImageUploadField
          label="Favicon"
          value={portfolio.seo.faviconUrl}
          publicUrlThumb="/favicon-thumb.webp"
          publicUrlFull="/favicon.webp"
          onUploaded={(thumbUrl, fullUrl) => updateSeo("faviconUrl", fullUrl)}
          onRemoved={() => updateSeo("faviconUrl", null)}
        />
        <ImageUploadField
          label="OG Image (default homepage)"
          value={portfolio.seo.ogImage}
          publicUrlThumb="/og-image-thumb.webp"
          publicUrlFull="/og-image.webp"
          onUploaded={(thumbUrl, fullUrl) => updateSeo("ogImage", fullUrl)}
          onRemoved={() => updateSeo("ogImage", null)}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        Favicon dan OG Image sama-sama disimpan sebagai versi penuh (bukan thumbnail) karena keduanya perlu resolusi
        yang cukup untuk ditampilkan oleh browser tab dan preview link sosial media.
      </p>

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Resume PDF</h3>
      <PdfUploadField
        label="Resume (EN)"
        value={portfolio.resumeFiles.en}
        targetUrl="/images/Resume-(English).pdf"
        onUploaded={(url) => updateResumeFile("en", url)}
        onRemoved={() => updateResumeFile("en", null)}
      />
      <PdfUploadField
        label="Resume (ID)"
        value={portfolio.resumeFiles.id}
        targetUrl="/images/Resume-(Indonesia).pdf"
        onUploaded={(url) => updateResumeFile("id", url)}
        onRemoved={() => updateResumeFile("id", null)}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Lain-lain</h3>
      <FormField label="Teks footer (copyright)">
        <TextInput value={portfolio.footerCopyrightText} onChange={(e) => updateFooterText(e.target.value)} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-zinc-300 mt-2">
        <input type="checkbox" checked={portfolio.flags.showCursor} onChange={(e) => updateShowCursor(e.target.checked)} />
        Custom cursor aktif
      </label>

      <PublishBar />
    </AdminLayout>
  );
}
```

Note: `resumeFiles.en`/`.id` intentionally point at the same fixed paths the existing PDFs already use (`public/images/Resume-(English).pdf`, `public/images/Resume-(Indonesia).pdf`) so uploading a replacement simply overwrites the file that `Header`'s resume link already references, with no need to change the link itself.

- [ ] **Step 2: Manual verification**

Upload a favicon and OG image, confirm `data/portfolio.json`'s `seo.faviconUrl`/`seo.ogImage` end up as public URLs (`/favicon.webp`, `/og-image.webp`), never `public/`-prefixed repo paths; upload replacement resume PDFs; edit SEO fields and the footer copyright text; toggle custom cursor; publish in dev mode; confirm `public/images/Resume-(English).pdf` was overwritten and the homepage's cursor behavior and meta tags (checked via browser devtools, wired up in Task 40) reflect the changes.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/settings.js
git commit -m "feat: add Settings admin page (SEO, favicon, OG image, resume PDFs, footer text, flags), storing public URLs only"
```

---

## Phase 6: Public pages consume the expanded portfolio.json

### Task 33: Pure project-lookup helpers

**Files:**
- Create: `utils/projects.js`

**Interfaces:**
- Produces: `getPublishedProjects(portfolio)`, `findProjectBySlug(portfolio, slug)`, `getAdjacentProjects(portfolio, slug)` — consumed by `pages/projects/[slug].js` (Task 34) and `pages/index.js` (Task 35).

- [ ] **Step 1: Write the failing test**

Create `utils/__tests__/projects.test.js`:

```js
const { getPublishedProjects, findProjectBySlug, getAdjacentProjects } = require("../projects");

const fixture = {
  projects: [
    { id: "1", slug: "alpha", order: 0, published: true },
    { id: "2", slug: "beta", order: 2, published: true },
    { id: "3", slug: "gamma", order: 1, published: false },
    { id: "4", slug: "delta", order: 1, published: true },
  ],
};

test("getPublishedProjects returns only published, sorted by order", () => {
  const result = getPublishedProjects(fixture);
  expect(result.map((p) => p.slug)).toEqual(["alpha", "delta", "beta"]);
});

test("findProjectBySlug finds a published project", () => {
  expect(findProjectBySlug(fixture, "alpha").id).toBe("1");
});

test("findProjectBySlug returns null for an unpublished project", () => {
  expect(findProjectBySlug(fixture, "gamma")).toBeNull();
});

test("findProjectBySlug returns null for a missing slug", () => {
  expect(findProjectBySlug(fixture, "missing")).toBeNull();
});

test("getAdjacentProjects returns prev/next in published order", () => {
  const result = getAdjacentProjects(fixture, "delta");
  expect(result.prev.slug).toBe("alpha");
  expect(result.next.slug).toBe("beta");
});

test("getAdjacentProjects returns null at the boundaries", () => {
  expect(getAdjacentProjects(fixture, "alpha").prev).toBeNull();
  expect(getAdjacentProjects(fixture, "beta").next).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/__tests__/projects.test.js`
Expected: FAIL with `Cannot find module '../projects'`.

- [ ] **Step 3: Write the module**

Create `utils/projects.js`:

```js
function getPublishedProjects(portfolio) {
  return portfolio.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
}

function findProjectBySlug(portfolio, slug) {
  const published = getPublishedProjects(portfolio);
  return published.find((p) => p.slug === slug) || null;
}

function getAdjacentProjects(portfolio, slug) {
  const published = getPublishedProjects(portfolio);
  const index = published.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
}

module.exports = { getPublishedProjects, findProjectBySlug, getAdjacentProjects };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/__tests__/projects.test.js`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/projects.js utils/__tests__/projects.test.js
git commit -m "feat: add pure project lookup/sort/adjacency helpers"
```

### Task 34: `ProjectCard` and `Lightbox` components

**Files:**
- Create: `components/ProjectCard/index.js`, `components/Lightbox/index.js`

**Interfaces:**
- Produces: `<ProjectCard project lang/>` (clickable card linking to `/projects/{slug}`, stops propagation on its own link/tag buttons), `<Lightbox images startIndex onClose/>` (keyboard arrows/ESC, swipe, next/prev) — consumed by `pages/index.js` (Task 35) and `pages/projects/[slug].js` (Task 36).

Two Next.js 12.3 API notes that apply throughout this task (and every other task using `next/image`/`next/link`, including Task 35): the `fill` prop on `<Image>` and Link's auto-wrapping `<a>` behavior were both introduced in Next 13 — on 12.3.4 the correct, only-valid patterns are `<Image layout="fill" objectFit="cover" .../>` and `<Link href="..."><a className="...">...</a></Link>` (no `legacyBehavior` prop needed — that prop exists in 12.2+ purely as a forward-compat opt-in for the *old* behavior once 13 later made it non-default, so passing it in 12.x is a harmless no-op today but adds noise; just omit it and nest the `<a>` directly, which is already what "old behavior" means on this version).

- [ ] **Step 1: Write ProjectCard**

Create `components/ProjectCard/index.js`:

```js
import Link from "next/link";
import Image from "next/image";

export default function ProjectCard({ project, lang, featuredSpan }) {
  return (
    <Link href={"/projects/" + project.slug}>
      <a
        className={
          "glow-card group w-full rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-4 transition-colors duration-300 hover:border-brand-400/30 overflow-hidden " +
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
      </a>
    </Link>
  );
}
```

- [ ] **Step 2: Write Lightbox**

Create `components/Lightbox/index.js`:

```js
import { useEffect, useCallback, useState } from "react";
import Image from "next/image";

export default function Lightbox({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [touchStartX, setTouchStartX] = useState(null);

  const goNext = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 50) goPrev();
    if (deltaX < -50) goNext();
    setTouchStartX(null);
  };

  const current = images[index];

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button onClick={onClose} type="button" className="absolute top-6 right-6 text-white text-2xl leading-none" aria-label="Close">
        ✕
      </button>

      {images.length > 1 && (
        <button onClick={goPrev} type="button" className="absolute left-4 tablet:left-8 text-white text-3xl" aria-label="Previous image">
          ‹
        </button>
      )}

      <div className="relative w-[90vw] h-[70vh] max-w-4xl">
        <Image src={current.src} alt={current.captionEn || ""} layout="fill" objectFit="contain" sizes="90vw" />
      </div>

      {(current.captionEn || current.captionId) && (
        <p className="text-zinc-300 text-sm font-mono mt-4 max-w-xl text-center px-6">{current.captionEn || current.captionId}</p>
      )}

      {images.length > 1 && (
        <button onClick={goNext} type="button" className="absolute right-4 tablet:right-8 text-white text-3xl" aria-label="Next image">
          ›
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write a keyboard-navigation test for Lightbox**

Create `components/Lightbox/__tests__/Lightbox.test.js`:

```js
import { render, screen, fireEvent } from "@testing-library/react";
import Lightbox from "../index";

const images = [
  { src: "/a.webp", captionEn: "First", captionId: "Pertama" },
  { src: "/b.webp", captionEn: "Second", captionId: "Kedua" },
];

test("shows the caption for the starting image", () => {
  render(<Lightbox images={images} startIndex={0} onClose={() => {}} />);
  expect(screen.getByText("First")).toBeInTheDocument();
});

test("ArrowRight advances to the next image", () => {
  render(<Lightbox images={images} startIndex={0} onClose={() => {}} />);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(screen.getByText("Second")).toBeInTheDocument();
});

test("Escape calls onClose", () => {
  const onClose = jest.fn();
  render(<Lightbox images={images} startIndex={0} onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: Run and verify pass**

Run: `npx jest components/Lightbox/__tests__/Lightbox.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ProjectCard/index.js components/Lightbox/index.js components/Lightbox/__tests__/Lightbox.test.js
git commit -m "feat: add ProjectCard (clickable, stopPropagation on inner links) and Lightbox components"
```

### Task 35: Project detail page and custom 404

**Files:**
- Create: `pages/projects/[slug].js`, `pages/404.js`

**Interfaces:**
- Consumes: `getPublishedProjects`, `findProjectBySlug`, `getAdjacentProjects` (Task 33), `Lightbox` (Task 34), `data.seo` (Task 6 schema) for canonical URL, favicon, and the og:image fallback when a project has no thumbnail of its own.

- [ ] **Step 1: Write the detail page**

Create `pages/projects/[slug].js`:

```js
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
```

- [ ] **Step 2: Write the custom 404 page**

Create `pages/404.js`:

```js
import Link from "next/link";
import Header from "../components/Header";
import { useLanguage } from "../context/LanguageContext";

export default function Custom404() {
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-8 flex flex-col items-center justify-center text-center min-h-[70vh]">
        <p className="font-mono text-brand-400 text-sm mb-4">404</p>
        <h1 className="font-display text-3xl tablet:text-4xl font-black text-white mb-4">
          {lang === "en" ? "Page not found" : "Halaman tidak ditemukan"}
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          {lang === "en"
            ? "The page you are looking for does not exist or the project is not published yet."
            : "Halaman yang kamu cari tidak ada atau project belum dipublish."}
        </p>
        <Link href="/">
          <a className="text-sm px-6 py-3 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 hover:bg-brand-300 transition-all">
            {lang === "en" ? "Back to home" : "Kembali ke beranda"}
          </a>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
npm run build && npm run start
```

Visit `/projects/field-sales-crm` (should render; empty Problem/Solution/Features/Impact sections should be hidden entirely since Task 6 seeded them as empty strings/arrays); check the page source for `<link rel="canonical">` pointing at the right slug and `og:image` falling back to `data.seo.ogImage` (since no project has a thumbnail yet at this point in the plan); visit `/projects/does-not-exist` (should render the custom 404, and its "Back to home" button should actually navigate, confirming the `<Link><a>` fix); temporarily set a project's `published` to `false` in `data/portfolio.json` and confirm its detail page also 404s, then revert.

- [ ] **Step 4: Commit**

```bash
git add "pages/projects/[slug].js" pages/404.js
git commit -m "feat: add project detail page with gallery lightbox, seo tags, adjacent nav, and custom 404"
```

---

### Task 36: Update `Hero` to read status card and buttons from data

**Files:**
- Modify: `components/Hero/index.js`

**Interfaces:**
- Consumes: `data.statusCard`, `data.heroButtons` (Task 6 schema).

- [ ] **Step 1: Replace the hardcoded `erpStatusesData` and buttons**

In `components/Hero/index.js`, delete the entire `erpStatusesData` object and the `erpStatuses` line, replacing them with:

```js
const STATUS_DISPLAY = {
  active: { en: "active", id: "aktif" },
  in_progress: { en: "in progress", id: "sedang berjalan" },
  open: { en: "open", id: "terbuka" },
};
```

and inside the component body, replace the removed `erpStatuses` variable with:

```js
const statusItems = data.statusCard;
```

Then in the JSX, replace the `erpStatuses.map(...)` block's per-item rendering:

```jsx
{statusItems.map((item) => (
  <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.04] rounded-lg transition-colors duration-150">
    <div className="flex items-center gap-2.5">
      {item.status === "active" ? (
        <span className="text-brand-400 font-bold">✓</span>
      ) : (
        <span className="text-amber-400 text-[9px] animate-pulse">●</span>
      )}
      <span className="text-zinc-200">{item[lang === "en" ? "labelEn" : "labelId"]}</span>
    </div>
    <span className={"text-[11px] font-semibold " + (item.status === "active" ? "text-brand-400" : "text-amber-400")}>
      {STATUS_DISPLAY[item.status][lang]}
    </span>
  </div>
))}
```

Replace the terminal-window header text `~/dev — status` with `~/dev/status` (removes the last remaining em dash in this file).

Replace the two hardcoded CTA buttons:

```jsx
<button onClick={handleWorkScroll} className="...">
  {lang === "en" ? "View projects" : "Lihat proyek"} <span>→</span>
</button>
<button onClick={() => window.open(...)} className="...">
  {lang === "en" ? "Contact me" : "Hubungi saya"}
</button>
```

with a data-driven loop:

```jsx
{data.heroButtons.map((btn, idx) => (
  <button
    key={btn.id}
    onClick={() => {
      if (btn.href === "#work") {
        handleWorkScroll();
      } else {
        window.open(btn.href);
      }
    }}
    className={
      idx === 0
        ? "text-sm px-6 py-3.5 rounded-full font-mono font-bold flex items-center gap-2 whitespace-nowrap bg-brand-400 text-zinc-950 transition-all duration-200 hover:bg-brand-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(74,158,255,0.7)]"
        : "text-sm px-6 py-3.5 rounded-full font-mono font-semibold whitespace-nowrap border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
    }
  >
    {btn[lang === "en" ? "labelEn" : "labelId"]}
    {idx === 0 && <span>→</span>}
  </button>
))}
```

(Keeps the exact same two visual button styles — filled primary first, outlined second — now driven by array position rather than hardcoded JSX, matching the two seeded `heroButtons` from Task 6.)

Also replace the three JSX comment em dashes (`min-height, not a fixed height — content is always...`, `Fixed-size box for the typewriter line — its word length...`, `Floating status card — sits beside the heading...`) with commas, for consistency with the global no-em-dash rule even though these are non-rendered comments.

- [ ] **Step 2: Manual verification**

```bash
npm run dev
```

Confirm the Hero status card shows the 7 seeded items with correct check/pulse icons and EN/ID status text, and both Hero buttons still scroll-to-projects and open the mail client exactly as before.

- [ ] **Step 3: Commit**

```bash
git add components/Hero/index.js
git commit -m "content: source Hero status card and CTA buttons from portfolio.json"
```

### Task 37: Update `Header` to read nav labels and gate the resume link on file presence

**Files:**
- Modify: `components/Header/index.js`

**Interfaces:**
- Consumes: `data.nav`, `data.resumeFiles` (Task 6 schema).

- [ ] **Step 1: Replace the hardcoded `navTranslations`**

Delete the `navTranslations` object and `const t = navTranslations[lang] || navTranslations.en;` line, replacing with:

```js
const { name, nav } = data;
const t = nav[lang] || nav.en;
```

- [ ] **Step 2: Gate the resume link on an uploaded file existing**

Replace every occurrence of:

```jsx
<a
  href={lang === "id" ? "/images/Resume-(Indonesia).pdf" : "/images/Resume-(English).pdf"}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  {t.resume}
</a>
```

with:

```jsx
{data.resumeFiles[lang] && (
  <a href={data.resumeFiles[lang]} target="_blank" rel="noopener noreferrer" className="...">
    {t.resume}
  </a>
)}
```

(keep each occurrence's original `className` string unchanged — there are 2 occurrences, mobile and desktop). This makes the resume link disappear cleanly if the admin removes a resume PDF via Settings (Task 32) instead of linking to a 404.

- [ ] **Step 3: Manual verification**

Confirm nav labels still read "Projects/About/Contact/Resume" (EN) and "Proyek/Tentang/Kontak/Resume" (ID); temporarily set `resumeFiles.en` to `null` in `data/portfolio.json`, confirm the EN resume link disappears from both mobile and desktop headers, then revert.

- [ ] **Step 4: Commit**

```bash
git add components/Header/index.js
git commit -m "content: source Header nav labels from portfolio.json, hide resume link when no file is set"
```

### Task 38: Update `Footer` to read CTA text and footer-placement socials from data

**Files:**
- Modify: `components/Footer/index.js`

**Interfaces:**
- Consumes: `data.footerCta`, `data.socials` (filtered by `placement === "footer_cta"`), `data.footerCopyrightText` (Task 6 schema).

- [ ] **Step 1: Replace the hardcoded `translations` object**

Delete the `translations` object and `const t = translations[lang] || translations.en;` line, replacing with:

```js
const t = {
  title: data.footerCta.title[lang],
  description: data.footerCta.description[lang],
  emailBtn: data.footerCta.emailButtonLabel[lang],
};
```

- [ ] **Step 2: Replace the hardcoded FastWork/Projects.co.id buttons**

Delete the two hardcoded `<button onClick={() => window.open("https://fastwork.id/...")}>` / `<button onClick={() => window.open("https://projects.co.id/...")}>` elements, replacing with:

```jsx
{data.socials
  .filter((social) => social.placement === "footer_cta" && social.published)
  .sort((a, b) => a.order - b.order)
  .map((social) => (
    <button
      key={social.id}
      onClick={() => window.open(social.link)}
      className="text-sm px-6 py-3.5 rounded-full font-mono font-semibold border border-white/15 text-zinc-200 hover:border-brand-400/60 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
    >
      {social.title}
    </button>
  ))}
```

- [ ] **Step 3: Replace the hardcoded copyright name**

Replace:

```jsx
<span>© {new Date().getFullYear()} Jovfrin Joiner</span>
```

with:

```jsx
<span>© {new Date().getFullYear()} {data.footerCopyrightText}</span>
```

and add `import data from "../../data/portfolio.json";` at the top of the file (it was previously imported already for `data.socials` in the email button's `onClick`, so this import likely already exists — confirm and do not duplicate it).

- [ ] **Step 4: Manual verification**

Confirm the Footer CTA title/description/email button still render correctly per language, and the FastWork + Projects.co.id buttons still appear (now sourced from `data.socials` with `placement: "footer_cta"`) and still open their respective URLs.

- [ ] **Step 5: Commit**

```bash
git add components/Footer/index.js
git commit -m "content: source Footer CTA text and footer-placement social buttons from portfolio.json"
```

### Task 39: Decouple `Button` from `data/portfolio.json`

**Files:**
- Modify: `components/Button/index.js`

**Interfaces:**
- Produces: `<Button showCursor={boolean}>` — `showCursor` becomes an explicit prop (default `false`) instead of an implicit import, so this shared component has no hidden coupling to the content file. Existing call sites that don't pass `showCursor` keep working identically to today's default-off behavior.

- [ ] **Step 1: Remove the data import and destructure a prop instead**

Replace:

```js
import React from "react";
import data from "../../data/portfolio.json";

const Button = ({ children, type, onClick, classes }) => {
```

with:

```js
import React from "react";

const Button = ({ children, type, onClick, classes, showCursor = false }) => {
```

and replace both occurrences of `data.showCursor && "cursor-none"` with `showCursor && "cursor-none"`.

- [ ] **Step 2: Confirm no call site relied on the implicit import**

```bash
grep -rn "components/Button" pages components --include="*.js" | grep -v node_modules
```

For any call site found, if the surrounding component already reads `data.flags.showCursor` (post Task 6 migration) or has it in scope, pass it through as `showCursor={data.flags.showCursor}`; otherwise leave the default `false`, matching current visual behavior since `showCursor` already defaults to `false` in the seeded data.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/Button/index.js
git commit -m "refactor: decouple Button from data/portfolio.json, accept showCursor as a prop"
```

### Task 40: Rewrite `pages/index.js` — renumbered sections, ProjectCard grid, How I Work, tech stack levels

**Files:**
- Modify: `pages/index.js`

**Interfaces:**
- Consumes: `ProjectCard` (Task 34), `data.services`/`data.howIWork`/`data.techstack`/`data.socials`/`data.socials_section`/`data.seo` (Task 6 schema).

This is the largest single content change: it renumbers sections to `01 Projects, 02 Services, 03 How I Work, 04 About, 05 Tech Stack, 06 Connect` (inserting How I Work per spec A5, "update penomoran section setelahnya"), swaps the inline project-card JSX for `<ProjectCard/>`, filters `services`/`socials` by `published`, renders tech stack items with Main/Familiar styling, wires the global `data.seo` fields into `<Head>`, and fixes the remaining em dash in the Projects section description.

- [ ] **Step 1: Replace the `socialConfig`/`defaultSocial` `action` fields**

In the `socialConfig` and `defaultSocial` objects, delete every `action: { en: "...", id: "..." }` property (that text now lives per-item in `data.socials[].actionEn`/`.actionId`, edited via the Contact & Social admin page from Task 30) — keep `color` and `icon` untouched.

- [ ] **Step 2: Wire `data.seo` into `<Head>`**

Replace the entire existing `<Head>...</Head>` block (which currently hardcodes the description/keywords/og text inline) with:

```jsx
<Head>
  <title>{data.seo[lang === "en" ? "titleEn" : "titleId"]}</title>
  <meta name="description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
  <meta name="keywords" content={data.seo.keywords} />
  <meta name="author" content={data.name} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={data.seo.canonicalUrl} />
  {data.seo.faviconUrl && <link rel="icon" href={data.seo.faviconUrl} />}

  <meta property="og:type" content="website" />
  <meta property="og:title" content={data.seo[lang === "en" ? "titleEn" : "titleId"]} />
  <meta property="og:description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
  <meta property="og:url" content={data.seo.canonicalUrl} />
  <meta property="og:site_name" content={data.name} />
  {data.seo.ogImage && <meta property="og:image" content={data.seo.canonicalUrl.replace(/\/$/, "") + data.seo.ogImage} />}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.seo[lang === "en" ? "titleEn" : "titleId"]} />
  <meta name="twitter:description" content={data.seo[lang === "en" ? "descriptionEn" : "descriptionId"]} />
</Head>
```

This replaces every previously hardcoded SEO string (including the `data.headerTaglineThree[lang]` used as the og:description in the original draft of this file) with the admin-editable `data.seo.*` fields from Task 32's Settings page.

- [ ] **Step 3: Replace the Projects section body**

Replace the `data.projects.map((project, index) => (...))` block (the entire hand-rolled card JSX) with:

```jsx
<motion.div className="grid grid-cols-1 laptop:grid-cols-2 gap-6" variants={gridReveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
  {data.projects
    .filter((project) => project.published)
    .sort((a, b) => a.order - b.order)
    .map((project) => (
      <motion.div key={project.id} variants={cardReveal} whileHover={{ y: -4 }}>
        <ProjectCard project={project} lang={lang} featuredSpan={project.featured} />
      </motion.div>
    ))}
</motion.div>
```

Add `import ProjectCard from "../components/ProjectCard";` to the top of the file, and add `id="work"` to the Projects section's outer `motion.div` (it currently only has `ref={workRef}`) so the Hero's `href="#work"` button (Task 36) has a real anchor to target in addition to the JS-driven `handleWorkScroll`.

Fix the section description's em dash:

```jsx
description={
  lang === "en"
    ? "A selection of systems shipped end-to-end, from database to responsive UI."
    : "Sejumlah sistem yang dibangun end-to-end, dari database sampai tampilan responsif."
}
```

- [ ] **Step 4: Filter Services by `published` and renumber to `02`**

Change:

```jsx
{data.services.map((service, index) => (
```

to:

```jsx
{data.services
  .filter((service) => service.published)
  .sort((a, b) => a.order - b.order)
  .map((service) => (
```

(update the closing accordingly, and use `service.id` as the `key` instead of `index`). The `SectionHeading index="02"` stays `02` (unchanged, Services keeps its position).

- [ ] **Step 5: Insert the new How I Work section (`03`), matching the existing section pattern**

Immediately after the Services section's closing `</motion.div>` and before the (renumbered) About section, insert:

```jsx
<motion.div
  className="mt-32 tablet:mt-40 pt-16 border-t border-white/10"
  variants={sectionReveal}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, amount: 0.15 }}
>
  <SectionHeading index="03" title={data.howIWork.title[lang]} description={data.howIWork.description[lang]} />

  <motion.div className="flex flex-col gap-4" variants={gridReveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
    {data.howIWork.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step, idx) => (
        <motion.div
          key={step.id}
          variants={cardReveal}
          className="glow-card w-full p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex gap-5 items-start transition-colors duration-300 hover:border-brand-400/30"
        >
          <span className="font-mono text-sm text-brand-400 font-semibold shrink-0">{String(idx + 1).padStart(2, "0")}</span>
          <div>
            <h4 className="font-display text-lg font-bold text-white tracking-tight mb-1">{step.title[lang]}</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">{step.description[lang]}</p>
          </div>
        </motion.div>
      ))}
  </motion.div>
</motion.div>
```

- [ ] **Step 6: Renumber About (`04`) and Tech Stack (`05`), add Main/Familiar styling to tech items**

Change the About section's `<SectionHeading index="03" .../>` to `index="04"`.

Change the Tech Stack section's `<SectionHeading index="04" .../>` to `index="05"`, and replace the item-rendering `category.items.map((item, itemIdx) => (<span>...))` block with:

```jsx
{category.items.map((item) => (
  <span
    key={item.id}
    className={
      item.level === "main"
        ? "text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 bg-white/[0.02] hover:text-white hover:border-brand-400/40 transition-all duration-200 cursor-default hover:scale-[1.03]"
        : "text-xs font-mono px-3 py-1.5 rounded-lg border border-white/5 text-zinc-600 bg-white/[0.01] cursor-default inline-flex items-center gap-1.5"
    }
  >
    {item.name}
    {item.level === "familiar" && <span className="text-[9px] uppercase tracking-wide text-zinc-700">Familiar</span>}
  </span>
))}
```

- [ ] **Step 7: Renumber Connect (`06`) and filter socials by placement + published**

Change the Connect section's `<SectionHeading index="05" .../>` to `index="06"`.

Change:

```jsx
{data.socials.map((social) => {
```

to:

```jsx
{data.socials
  .filter((social) => social.placement === "connect_grid" && social.published)
  .sort((a, b) => a.order - b.order)
  .map((social) => {
```

and inside the map body, replace `config.action[lang]` (which no longer exists on `socialConfig`/`defaultSocial` after Step 1) with `social[lang === "en" ? "actionEn" : "actionId"]`.

- [ ] **Step 8: Run build and verify**

```bash
npm run build && npm run dev
```

Visit `/`, confirm section order/numbering reads `01 Projects, 02 Services, 03 How I Work, 04 About, 05 Tech Stack, 06 Connect`; confirm the first (featured) project card spans two columns and the rest are single width; confirm draft projects/services/socials do not render; confirm tech stack shows dimmed "Familiar" tags alongside normal "Main" tags including the new `Bootstrap` main tag; view page source and confirm `<title>`, meta description/keywords, canonical link, and og: tags all match `data.seo.*` rather than any hardcoded string.

- [ ] **Step 9: Commit**

```bash
git add pages/index.js
git commit -m "content: renumber homepage sections, add How I Work, wire ProjectCard grid, tech stack levels, and SEO meta tags from data"
```

---

## Phase 7: Test infrastructure, README, env template, manual QA

> **Execution-order note:** Task 41 sets up the Jest configuration that every `npx jest ...` command in Tasks 4 through 40 already assumes exists. Run Task 41 immediately after Task 3 (dead code removal) and before Task 4, even though it is written last in this document for narrative grouping with the rest of Phase 7's project-hygiene work.

### Task 41: Jest configuration

**Files:**
- Create: `jest.config.js`, `jest.setup.js`
- Modify: `package.json` (add `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`; add `"test": "jest"` script)

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

(`node-mocks-http` was already installed in Task 8.)

- [ ] **Step 2: Write the Jest config**

Create `jest.config.js`:

```js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>"],
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```js
import "@testing-library/jest-dom";
```

Note on per-file environment overrides: `next/jest`'s config defaults every test to `jsdom` (needed for the many React component tests in this plan). Any test that needs real Node built-ins instead (every `pages/api/**/__tests__/*.test.js` and most of `utils/__tests__/*.test.js`, which use `fs`, real `Buffer` semantics, or `node-mocks-http`) opens with the docblock `/** @jest-environment node */` as its very first line, overriding the default for that file only — this docblock already appears in every such test written in Tasks 4-15 above.

- [ ] **Step 3: Wire the test script**

In `package.json`, add:
```json
"test": "jest",
```

- [ ] **Step 4: Run the full suite**

```bash
npm test
```

Expected: every test file written in Tasks 4 through 39 passes (`portfolioSchema`, `session`, `loginRateLimit`, `login` API, `imageProcessing`, `github`, `localPublish`, `publish` API, `AdminDraftContext`, `ConfirmDialog`, `SortableList`, `ImageUploadField`, `projects`, `Lightbox`).

- [ ] **Step 5: Commit**

```bash
git add jest.config.js jest.setup.js package.json package-lock.json
git commit -m "test: add Jest configuration (next/jest, jsdom default, per-file node override)"
```

### Task 42: `.env.example` and README

**Files:**
- Create: `.env.example`
- Modify: `README.md` (full rewrite — the existing content is the original open-source template's README and no longer describes this project)

- [ ] **Step 1: Write `.env.example`**

Create `.env.example`:

```bash
# Postgres/Prisma/Blob are NOT used by this project. Everything below is for the
# GitHub-commit-based admin panel described in README.md.

# Single admin login. ADMIN_PASSWORD_HASH is a bcrypt hash, never a plaintext password.
# Generate one locally with:
#   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH="$2a$10$replace-with-a-real-bcrypt-hash"

# Encryption key for the admin session cookie (iron-session). Must be at least
# 32 characters. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_SECRET="replace-with-a-random-32-plus-character-string"

# GitHub fine-grained personal access token, scoped to ONLY this repository,
# with repository permission "Contents: Read and write". Used by the admin
# panel's Publish button to commit content changes directly via the Git Data API.
GITHUB_TOKEN="github_pat_replace_me"

# The repository the admin panel commits to.
GITHUB_OWNER="Jovfrinn"
GITHUB_REPO="portfolio-website"

# The branch this deployment's Publish button commits to.
#
# - Production environment (Vercel): set this to "main" (or whatever branch your
#   production deployment tracks). This is the only place it should ever be "main".
# - Preview environment (Vercel), while testing this admin panel per this project's
#   "verify on a Preview deployment before merging" rule: set this to the FEATURE
#   BRANCH you are testing (e.g. "feature/admin-cms-github-publish"), NEVER "main".
#   A Preview deployment still runs the exact same production publish code path, so
#   if this is left as "main" here, clicking Publish while testing on Preview commits
#   straight to production - defeating the entire point of testing on Preview first.
GITHUB_BRANCH="main"
```

- [ ] **Step 2: Write the new README**

Replace the entire contents of `README.md` with:

```markdown
# Jovfrin Joiner - Portfolio

Personal portfolio site built with Next.js 12 (Pages Router) and Tailwind CSS. All content (hero copy, projects,
services, tech stack, contact links, SEO settings, and more) is managed through a single-admin `/admin` panel and
stored in `data/portfolio.json`, which is version-controlled like any other source file.

## How content publishing works

There is no database and no object storage. `/admin` loads the current `data/portfolio.json`, lets you edit every
section, and stages your changes as a draft in the browser. Pressing **Publish**:

- In production, bundles the edited JSON plus any new/removed WebP images into a single Git commit via GitHub's
  Git Data API, which pushes straight to the `GITHUB_BRANCH` branch. Vercel is watching that branch and redeploys
  automatically, so changes go live in about 1-2 minutes.
- In local development (`NODE_ENV=development`), writes straight to your local filesystem instead, so you can test
  the whole admin flow without touching GitHub or waiting for a deploy.

Every publish is validated against the schema in `utils/portfolioSchema.js` first; an invalid document is rejected
with a clear error instead of ever reaching Git or disk.

## Local setup

1. Clone the repo and install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Copy `.env.example` to `.env.local` and fill in every value (see the comments in that file for what each one is
   and how to generate it). At minimum for local development you need `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and
   `SESSION_SECRET` - the `GITHUB_*` variables are only read in production, since dev-mode publishing writes to
   your local disk instead.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` for the public site, or `http://localhost:3000/admin/login` to sign in with the
   `ADMIN_EMAIL` / plaintext password whose hash you put in `ADMIN_PASSWORD_HASH`.

## Creating your admin account

There is no signup flow and no database row for the admin user - the single account is defined entirely by two
env vars. To set (or change) your password:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"
```

Paste the printed hash into `ADMIN_PASSWORD_HASH` (locally in `.env.local`, and in your Vercel project's
Environment Variables for production), and set `ADMIN_EMAIL` to whatever email you want to sign in with.

## Deploying

1. Push this repo to GitHub and import it into Vercel as you normally would.
2. In the Vercel project's Environment Variables, set every variable listed in `.env.example` for the Production
   environment. Set `GITHUB_BRANCH=main` (or whatever branch production tracks) **only** for Production.
3. Create a GitHub fine-grained personal access token scoped to only this repository, with the "Contents:
   Read and write" repository permission, and put it in `GITHUB_TOKEN`. Set `GITHUB_OWNER` / `GITHUB_REPO` to
   match the repo.
4. Every `next build` run (locally or on Vercel) first runs `scripts/validate-portfolio.js` via the `prebuild`
   npm lifecycle hook; a malformed `data/portfolio.json` fails the build loudly instead of deploying broken content.

### Testing the admin panel on a Vercel Preview deployment

If you also set every env var for the Preview environment so you can test the admin panel before merging a feature
branch (as this project's contribution workflow requires), **set `GITHUB_BRANCH` for Preview to that feature
branch's name, never to `main`**. A Preview deployment runs the exact same publish code as Production - the only
thing that decides which branch a Publish click actually commits to is `GITHUB_BRANCH`. Leaving it as `main` while
testing on a Preview URL means every test commit lands on production instead of the branch you're trying to verify.

## Running tests

```bash
npm test
```

## Project structure

- `data/portfolio.json` - all site content, bilingual (`en`/`id`) per field. Never edit this by hand once the
  admin panel is live; use `/admin` instead so validation and the Git commit flow stay in sync.
- `utils/portfolioSchema.js` - the Zod schema (and em-dash guard) every publish and every build validates against.
- `utils/github.js` / `utils/localPublish.js` - the two publish backends (production Git commit vs. local
  filesystem write), sharing the same conflict-detection shape.
- `components/admin/` - the admin panel's shared UI shell and draft-state context.
- `pages/admin/` - one page per content section (Hero, Projects, Services, and so on).
- `pages/projects/[slug].js` - the public project detail page, statically generated from published projects only.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add .env.example and rewrite README for the admin CMS workflow"
```

### Task 43: Manual QA checklist

**Files:** none (verification only)

- [ ] **Step 1: Mobile-first check at 375px**

In the browser devtools, set the viewport to 375x812 (iPhone SE/mini class) and walk through: Header (mobile menu opens/closes, language toggle works), Hero (status card scrolls internally without breaking layout, typewriter line doesn't shift the CTA row), Projects grid (single column, featured card not oddly stretched), Services, How I Work (steps stack vertically, numbers align), About, Tech Stack (tags wrap without overflow), Connect grid (2 columns), Footer CTA. Repeat for the `/projects/{slug}` detail page (gallery grid drops to 2 columns per the `tablet:grid-cols-3` breakpoint) and `/admin/*` pages (sidebar becomes usable or is acceptable to scroll — admin is explicitly allowed to be "simpel dan fungsional", not pixel-perfect at 375px, but must not be unusable).

- [ ] **Step 2: Loading and empty states**

Confirm: `/admin/*` pages show "Memuat..." while `useAdminDraft()` is loading and never flash undefined/null field errors; a project with an empty `gallery` array renders its detail page with no gallery grid and no broken lightbox trigger; a project with empty `problem`/`solution`/`features`/`impact` (the default state seeded in Task 6 for all 5 existing projects) hides those sections entirely rather than rendering empty headings; `services`/`socials`/`howIWork.steps` all render correctly with zero items (temporarily empty the arrays in a scratch copy of `data/portfolio.json` to confirm no crash, then discard the scratch copy).

- [ ] **Step 3: End-to-end publish flow, both modes**

In development: log in, edit a field in every one of the 10 admin menus, upload one project thumbnail and one gallery image, delete one gallery image from a different project, Publish once, confirm `git diff` (or just re-reading the file) shows every change landed in one local write and the homepage reflects all of it after a refresh.

In a Vercel Preview deployment of the feature branch (per the global constraint requiring Preview verification before merge): **before doing anything else, confirm the Preview environment's `GITHUB_BRANCH` env var is set to this feature branch's name, not `main`** (see README's "Testing the admin panel on a Vercel Preview deployment" section from Task 42 — this is not optional, it is what stops a Preview test Publish from committing straight to production). Then repeat the same walkthrough, confirm the Publish button produces exactly one new commit on that feature branch (visible in the GitHub repo's commit history, and specifically NOT on `main`), and confirm the "Deploy sedang berjalan, tayang dalam 1 sampai 2 menit" message appears (the actual redeploy will land on production once merged, not on the Preview build itself, since Preview deployments do not auto-redeploy from new commits the same way the tracked production branch does - this is expected and only the commit-creation behavior is being verified here).

- [ ] **Step 4: Conflict handling**

Open the admin panel in two browser tabs (or profiles) logged in simultaneously, edit and Publish from tab A, then edit and Publish from tab B without reloading first; confirm tab B receives the 409 conflict message and instructions to reload, and does not silently overwrite tab A's commit.

- [ ] **Step 5: No em dash, final sweep**

```bash
grep -rn $'—' --include="*.js" --include="*.json" pages components utils data 2>/dev/null | grep -v node_modules
```

Expected: no output.

This task has no commit of its own; any fixes found during QA should be committed as small follow-up fixes referencing the specific issue, then this checklist re-run.

---

## Self-Review

**Spec coverage** (against the approved conversation spec, including the no-database revision):
- Langkah 0 analysis: done in-conversation before this plan; graph updates via `/graphify . --update` are a manual step the user runs after each major phase, not a plan task (noted below).
- A1 Project Card + thumbnail + clickable + stopPropagation + dark-theme fallback: Task 34 (`ProjectCard`) — fallback is the `project.path || project.title[lang]` text block when `thumbnailThumb` is null, matching dark theme via existing `bg-white/[0.03]` tokens.
- A2 Project detail page (all fields, gallery+lightbox, role/duration/problem/solution/features/impact, tags, links, back+prev/next nav, SEO, 404): Task 35.
- A3 Tech Stack main/familiar with the exact 10-item Main list: Task 6 (seed data) + Task 40 Step 5 (rendering).
- A4 Two new services: Task 6 (seed data).
- A5 How I Work section + renumbering: Task 6 (seed data) + Task 40 Steps 2-6.
- A6 No em dash + bilingual: enforced by `utils/portfolioSchema.js` (Task 4) and fixed at the source in Task 6; every new admin page carries EN/ID fields via `LocaleTabs`.
- B1 Admin general (route, login, rate limit, session, validation, confirm-before-delete, EN/ID tabs, drag reorder, publish toggle, Preview): Tasks 7-10 (auth), Task 18 (`ConfirmDialog`/`LocaleTabs`), Task 19 (`SortableList`), every menu page's `previewHref`.
- B2.1-B2.10 (all 10 menus): Tasks 22-32.
- B3 Upload (type/size validation, browser resize+WebP thumb/full, lazy load): Task 11 (validation/processing), Task 20/25 (`ImageUploadField`/gallery), Task 35 (`next/image` with `loading="lazy"` on gallery thumbnails).
- Bagian C migration (seeder → DB): reinterpreted per the no-database revision as Task 6 (one-time content migration directly into the still-file-based `data/portfolio.json`) — there is no separate seeder script because there is no database to seed into.
- Bagian D quality (preserve design, mobile-first 375px, loading/empty states, README): Tasks 36-40 (preserve existing Tailwind classes/animations, only swap data sources), Task 43 (QA checklist), Task 42 (README).
- Revision 1 (Next 12.3.4): Task 2.
- Revision 2 (client resize/WebP, no sharp, size/type validation, delete-on-remove): Task 11, Task 20/25, Task 24 (queues gallery/thumbnail deletes on project delete).
- Revision 3 (Prisma+Neon pooled/direct URL, singleton client): superseded entirely by the no-database revision; N/A.
- Revision 4 (admin seed via env, no hardcoded creds): `.env.example` (Task 42) + `pages/api/admin/login.js` (Task 9) reading `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` directly, no seed script needed since there is no database row to seed.
- Revision 5 (session security, all writes auth-gated): Task 7 (`withAdminApi`), applied to Tasks 14-15.
- Revision 6 (revalidate "/" and project slugs including old slug): superseded by the no-database, no-ISR revision — a publish is a fresh Git commit that triggers a full Vercel redeploy, so every static page (including every project slug, old or new) is regenerated automatically; no separate revalidation call is needed or possible without ISR.
- Revision 7 (dead code cleanup in its own commit, before new features): Task 3.
- Revision 8 (new branch, Vercel Preview verification): Task 1 + Task 43 Step 3.
- Revision 9 (`.env.example` complete with comments): Task 42.
- Revision 10 (no em dash): Task 4 (schema guard) + Task 6 (fixed at the source) + Task 43 Step 5 (final sweep).
- Second revision, no-database items 1-7: covered above; item 5 (dev-mode direct local write) is Task 13; item 6 (menus unchanged) is Tasks 22-32.
- Data-fix instructions (em dash removal, double-space bug, empty resume): Task 6.

**Placeholder scan:** no `TODO`/`TBD`/"add appropriate X" phrasing was used; every step includes literal code, literal JSON, or a literal shell command. The two places that intentionally leave content empty (`resume.*` fields, and new-project detail fields with no prior hardcoded source) are seed *data*, explicitly requested by the user to be left blank for later admin entry — not unfinished plan steps.

**Type/name consistency check:** `validatePortfolio` (Task 4) is imported identically in Task 5, Task 15, and referenced from every test fixture; `withAdminApi`/`withAdminSsr`/`withSessionApi` (Task 7) signatures match every call site in Tasks 9, 14, 15, 21-32; `useAdminDraft()`'s returned shape (Task 17) — `portfolio, loading, updatePortfolio, addPendingUpload, addPendingDelete, pendingUploads, pendingDeletes, isDirty, publish, publishing, publishMessage, reload` — is used with exactly these names in every admin page and in `PublishBar`/`ImageUploadField`; `getPublishedProjects`/`findProjectBySlug`/`getAdjacentProjects` (Task 33) signatures match their use in Task 35; schema field names (`heroButtons`, `statusCard`, `flags.showCursor`, `footerCta`, `footerCopyrightText`, `socials[].placement/actionEn/actionId`, `techstack.categories[].items[].level`, `howIWork.steps`, `resumeFiles`, `seo.*`) are identical across Task 4's schema, Task 6's seed data, every Phase 5 admin page, and every Phase 6 public-page update.

**Round 2 revisions (post user review) applied directly to the tasks above, not tracked as separate tasks:**
1. Public-URL-only storage: `ImageUploadField` (Task 20) and `PdfUploadField` (Task 32) now take `value`/`publicUrlThumb`/`publicUrlFull`/`targetUrl` — all public URLs — and convert to a repo path only at the exact moment they call `addPendingUpload`/`addPendingDelete`, via the new `publicUrlToRepoPath` helper (Task 11). Task 24's project-delete flow and Task 25's thumbnail/gallery fields were updated to match.
2. `faviconPathHint` removed entirely; Task 32's favicon/OG image fields store only the final public URL (the `fullUrl` from `ImageUploadField.onUploaded`).
3. Upload size limit now measured on base64 string length (the real request-body size) instead of decoded binary size, threshold raised to 4MB to match; checked client-side in `AdminDraftContext.publish()` (Task 17, before any fetch) and server-side in `/api/admin/publish` (Task 15) as a backup.
4. Every `<Image fill>` converted to `<Image layout="fill" objectFit="...">` (Next 12.3's actual API; `fill` is a Next 13+ prop) across Task 34 and Task 35; every `<Link>` converted to `<Link href><a className>...</a></Link>` with `legacyBehavior` removed, across Tasks 21, 34, and 35 (`pages/404.js`'s Link was missing its inner `<a>` entirely, a real bug fixed here).
5. Task 25's new-project creation moved from the render body into a `useEffect`.
6. Task 25's thumbnail and every gallery slot's `ImageUploadField` are `disabled` until `project.slug` is non-empty (paths are slug-derived), and editing the slug after images exist now surfaces an explicit warning instead of silently producing images that point at a stale path. Gallery image ids are generated once (on "Tambah gambar galeri" click), not recomputed from `Date.now()` on every render.
7. `data.seo.*` wired into `<Head>` on both `pages/index.js` (Task 40, replacing every previously hardcoded title/description/keywords string) and `pages/projects/[slug].js` (Task 35, adding canonical + favicon + an `og:image` fallback to `data.seo.ogImage` when a project has no thumbnail).
8. `jest.config.js`'s bogus `setupFilesAfterEach` key removed (not a real Jest option); `setupFilesAfterEnv` was already correct and unaffected.
9. `.env.example` and the README now explicitly warn that a Vercel Preview environment's `GITHUB_BRANCH` must be set to the feature branch under test, never `main` — Task 43's QA checklist checks this before running its Preview walkthrough.
10. The "run Task 41 before Task 4" note is now stated in two places: at the start of Phase 7 (where Task 41 is written) and immediately after Task 3 (where it must actually run).

---

Plan revised per the review above and saved back to `docs/superpowers/plans/2026-09-23-admin-cms-upgrade.md`. Proceeding directly to execution with **Subagent-Driven** per your instruction — a fresh subagent per task, with a stop-and-report checkpoint after each phase completes (summary + how to test it), waiting for your go-ahead before the next phase.
