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

