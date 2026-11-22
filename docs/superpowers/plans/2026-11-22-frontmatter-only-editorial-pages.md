# Frontmatter-only editorial pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every editorial page render only frontmatter blocks, with a `/services/`-style hero (H1 + intro + `featuredImage`) and no Markdown body in any `.md` entry.

**Architecture:** Existing `pageBlockSchema` / `PageHero` / `PageBlockRenderer` become the single rendering path for all editorial routes. The build-time validator derives document structure from blocks when a body is absent, while a new gate forbids bodies. Routes switch from `<Content />` to block rendering collection by collection.

**Tech Stack:** Astro 7, TypeScript 7, Zod via Astro Content Collections, Node test runner (`node --test`), pnpm.

**Spec:** `docs/service-detail-frontmatter-design.md`

## Global Constraints

- No public-facing `konsult*` / `consult*` wording in any file (CONTENT-013).
- `site.ts` is the SSOT for company identity, navigation, and labels; never hardcode breadcrumb/CTA copy in `.astro`.
- Every publishable entry keeps a non-empty `intro` field beginning with `<title> adalah` / `<title> is`, a unique `metaDescription`, and one `featuredImage` with an `alt` containing the copula and shorter than `intro`.
- Block `id` values are lowercase kebab-case and unique within an entry.
- Service associations stay explicit via `serviceId`; never infer from category, title, or slug.
- Body content is removed from all 22 editorial entries (7 pages, 4 services, 11 articles); category taxonomy records are out of scope.
- No new dependency, no new visual component family, no push/PR/merge.

## Review Focus

- **Service detail hero** — `/services/<slug>/` must have one section containing H1, intro, and the `featuredImage`; test: Task 4 route source + build audit.
- **Article pages losing their only H1** — removing body removes the only H1 in `ArticleLayout`; test: Task 5 adds hero block and switches route, build `audit:headings` must pass.
- **Validator silently accepting empty structure** — a body-less entry with no hero or skipped block headings must fail; test: Task 1 unit tests for CONTENT-001 and CONTENT-011 from blocks.
- **Duplicate featured images** — hero uses `featuredImage` as fallback while old layouts rendered their own image; test: Task 4/5 remove those layout images, `audit:page-images` must report exactly one image.
- **Residual body Markdown** — a future contributor re-adds a body and it is silently duplicated/ignored; test: Task 6 CONTENT-014 gate in build and changed-content preflight.

---

### Task 1: Derive editorial structure from frontmatter blocks in the validator

**Files:**
- Modify: `src/lib/content-validation.ts`
- Modify: `src/content-validation.ts`
- Test: `tests/content-validation.test.mjs`

**Interfaces:**
- Consumes: existing `ContentEntryLike`, `ParsedContent`, `validateEntry`, `validateAllEntries`.
- Produces: `parseFrontmatterContent(data: Record<string, unknown>): ParsedContent` (hero → H1; `content-section`/`faq`/`howto`/`cta`/`link-grid`/`listing`/`contact` → H2; `items`/`steps` → H3), `validateFrontmatterOnlyEntries(entries: ContentEntryLike[]): Diagnostic[]` (CONTENT-014 for non-empty body).

- [ ] **Step 1: Add failing tests for body-less entries**

Add to `tests/content-validation.test.mjs`:
- `body-less entry with a hero and valid block headings has no CONTENT-001/002/011`: entry with `body: ""`, `data.intro` valid, `blocks` = hero + content-section with two items; assert no diagnostics with those rules.
- `body-less entry with a skipped block heading reports CONTENT-011`: same but a block emits H3 directly after hero H1; assert `field === "blocks"` and `expectedLevel === 2`.
- `body-less entry without hero reports CONTENT-001`: assert `field === "blocks"`.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm test` (or `corepack pnpm test`)
Expected: the three new tests FAIL (CONTENT-001 on empty body, no block-derived diagnostics).

- [ ] **Step 3: Implement block-derived parsing**

In `src/lib/content-validation.ts`:
- Implement `parseFrontmatterContent` per the Interfaces block. Use each block's `title`/`eyebrow` as heading text; for `faq`/`cta` without a title use the language-appropriate generated label (`"Pertanyaan umum"` / `"FAQ"`, `"Ajukan Sertifikasi"` / `"Call to action"`) purely as heading text.
- In `validateEntry`, set `const hasBody = (entry.body ?? "").trim().length > 0;` and `const parsed = hasBody ? parseContent(entry.body) : parseFrontmatterContent(data);`.
- CONTENT-001: use `parsed.headings`, set `field` to `"body"` when `hasBody`, else `"blocks"`.
- CONTENT-002: keep existing checks only when `hasBody`; when body is empty require only `introField`.
- CONTENT-011: iterate `parsed.headings`, with the same `field` switch.
- Add `validateFrontmatterOnlyEntries` returning CONTENT-014 (`field: "body"`, reason: "Editorial entries must contain frontmatter only; remove the Markdown body.") for entries with a `title` and non-empty trimmed body.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pnpm test`
Expected: all tests pass, including the pre-existing body-based fixture tests. The CONTENT-014 gate is wired later in Task 6, after every entry has been converted.

- [ ] **Step 5: Commit**

`git add src/lib/content-validation.ts src/content-validation.ts scripts/validate-changed-content.mjs tests/content-validation.test.mjs && git commit -m "test: validate frontmatter block structure when body is absent"`

---

### Task 2: Schema and navigation helpers for frontmatter-only routes

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/data/breadcrumbs.ts`
- Test: `tests/breadcrumbs.test.mjs`

**Interfaces:**
- Consumes: `primaryNavigation` from `src/site.ts`, `pageBlockSchema` from `src/content.config.ts`.
- Produces: `articleSchema.blocks` and `serviceSchema.blocks` as `z.array(pageBlockSchema).optional()`; `serviceSchema.relatedArticles` as `{ title: string; emptyTitle?: string } | undefined`; `siteCrumb(href: string): { label: string; href: string }` throwing when `href` is not in `primaryNavigation`.

- [ ] **Step 1: Write the failing breadcrumb test**

`tests/breadcrumbs.test.mjs`: `siteCrumb("/services/")` equals `{ label: "Layanan", href: "/services/" }`; `siteCrumb("/")` equals `{ label: "Beranda", href: "/" }`; unknown href throws.

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement schema and helper**

In `src/content.config.ts` change `articleSchema` and `serviceSchema` to extend with `blocks: z.array(pageBlockSchema).optional()` and add `relatedArticles: z.object({ title: z.string().min(1), emptyTitle: z.string().optional() }).optional()` to `serviceSchema` only.
Create `src/data/breadcrumbs.ts` implementing `siteCrumb` by looking up `primaryNavigation`.

- [ ] **Step 4: Run check and tests**

Run: `pnpm check && pnpm test`
Expected: both exit 0.

- [ ] **Step 5: Commit**

`git add src/content.config.ts src/data/breadcrumbs.ts tests/breadcrumbs.test.mjs && git commit -m "feat: allow frontmatter blocks on articles and services"`

---

### Task 3: Convert the 7 page entries and the generic page route

**Files:**
- Modify: `src/content/pages/*.md` (7 files)
- Modify: `src/pages/[slug].astro`
- Modify: `tests/page-content-frontmatter.test.mjs`
- Modify: `tests/page-content-routes.test.mjs`

**Interfaces:**
- Consumes: `getPageEntry`, `getPageHero`, `getPageBlocks`, `PageHero`, `PageBlockRenderer`, `WidePageLayout`, `siteCrumb`.
- Produces: all page entries body-free with at least one `hero`; `src/pages/[slug].astro` no longer imports `render` or renders `<Content />`.

- [ ] **Step 1: Update tests first**

In `tests/page-content-frontmatter.test.mjs`, replace the body-heading test with: `body is empty`, `blocks contain exactly one hero`, and `derived heading levels from blocks never skip` (hero = 1, `content-section`/`faq`/`howto`/`cta`/`link-grid`/`listing`/`contact` = 2, their items/steps = 3).
In `tests/page-content-routes.test.mjs`, replace the about-us assertion with: generic route no longer contains `<Content`, contains `PageHero`, and contains `getPageHero`.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm test`
Expected: FAIL on body-empty and hero-count assertions.

- [ ] **Step 3: Convert entries**

For each of the 7 files: delete everything after the closing `---`. For `0010-halaman-about-us.md` only, add a first block `hero` with `id: hero-tentang`, `eyebrow`, `title` (kebab-free heading text), and `description` copied from the existing `intro`. Keep all other frontmatter unchanged.

- [ ] **Step 4: Switch the generic route**

In `src/pages/[slug].astro`: remove `render` import and `const { Content }`; remove `isAboutPage` branch, `ArticleLayout`, `FeaturedImage`, and `Section` usage; render a single `WidePageLayout` with `breadcrumbs={[siteCrumb("/"), { label: entry.data.title }]}`, `PageHero` (fallbackImage from `featuredImage`), and `PageBlockRenderer` with `blocks = getPageBlocks(entry)`.

- [ ] **Step 5: Run gates**

Run: `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm audit:headings`
Expected: all exit 0; no page loses its H1.

- [ ] **Step 6: Commit**

`git add src/content/pages src/pages/[slug].astro tests && git commit -m "feat(pages): render generic pages from frontmatter blocks only"`

---

### Task 4: Convert the 4 service entries and both detail routes

**Files:**
- Modify: `src/content/services/*.md` (4 files)
- Modify: `src/pages/services/[slug].astro`
- Modify: `src/pages/en/services/[slug].astro`
- Modify: `src/layouts/ServiceLayout.astro`
- Test: `tests/service-content-frontmatter.test.mjs` (new)

**Interfaces:**
- Consumes: Task 2 `relatedArticles`, `siteCrumb`, `PageHero`, `PageBlockRenderer`, `getRelatedArticles`, `getPublishedArticles`, `servicePageJsonLd`.
- Produces: `ServiceLayout` props `hero: HeroBlock`, `blocks: PageBlock[]`, `breadcrumbs: Array<{ label: string; href?: string }>`; it renders `PageHero` + `PageBlockRenderer` inside its existing wide article container and exposes a `<slot />` for the related-articles section. Service detail routes render that slot with the heading from `data.relatedArticles.title`; no `<Content />`.

- [ ] **Step 1: Write the failing test**

`tests/service-content-frontmatter.test.mjs`:
- every file in `src/content/services` has empty body, exactly one `hero` block, and a `relatedArticles.title`;
- for the three published services, the body-derived sections “Status pengembangan layanan”, “Proses sertifikasi secara umum”, “Referensi resmi” (or their EN equivalents) each appear as a `content-section`/`link-grid` block title;
- both service detail route sources contain `PageHero` prop passing and no `<Content`; `ServiceLayout.astro` contains `PageHero`, `PageBlockRenderer`, `siteCrumb`-supplied breadcrumbs, and no `<FeaturedImage` or hardcoded `"Beranda"`/`"Layanan"` labels.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm test`
Expected: FAIL on empty body, missing hero, and route source assertions.

- [ ] **Step 3: Convert service entries**

For each entry:
- Add `hero` as first block: `id: hero-layanan`, `eyebrow` from `category`, `title` = existing `title`, `description` = existing `intro`; do **not** set `image` (fallback to `featuredImage`).
- Convert body section “Status pengembangan layanan” / “Service development status” to a `content-section` (surface `white`), using the two paragraphs as `items` with short verbatim titles.
- Convert “Proses sertifikasi secara umum” / “Certification process overview” to a `content-section` (surface `navy`) with one `item` per process stage, split from the existing comma-separated list; keep the closing sentence in `description`.
- Convert “Referensi resmi” / “Official references” to a `link-grid` (surface `cream`) whose `items` use the link text as `title` and the URL as `href`.
- Add `relatedArticles: { title: "Artikel Terkait" }` for `id` entries and `title: "Related articles"` for `lang: en`.
- Delete the Markdown body. Do not change `title`, `intro`, `metaDescription`, or `featuredImage`.

- [ ] **Step 4: Refactor the layout and rewrite both routes**

In `src/layouts/ServiceLayout.astro`:
- Keep the existing `Layout` + `Container as="article" variant="wide" gutter={false}` shell.
- Change props to `title, description, lang?, canonical?, ogImage?, imageAlt, structuredData?, breadcrumbs?, hero: HeroBlock, blocks: PageBlock[]`; import `HeroBlock`/`PageBlock` types from `src/data/pages.ts`.
- Remove `FeaturedImage`, the `<div class="prose"><slot /></div>`, and the hardcoded breadcrumb array.
- Define `fallbackImage = { src: ogImage ?? "", alt: imageAlt }` once. Render `<Breadcrumbs items={breadcrumbs} />`, `{hero && <PageHero block={hero} fallbackImage={fallbackImage} />}`, then `<PageBlockRenderer blocks={blocks} fallbackImage={fallbackImage} />`, followed by `<slot />` for route-specific sections.

In both `src/pages/services/[slug].astro` and `src/pages/en/services/[slug].astro`:
- Remove `render` import and `const { Content }`; keep the `ServiceLayout` import.
- Pass `title`, `description`, `lang`, `canonical`, `ogImage`, `structuredData`, `breadcrumbs={[siteCrumb("/"), siteCrumb("/services/"), { label: service.data.title }]}`, `hero`, `imageAlt`, and `blocks` (all blocks except `hero`).
- Put the related-articles section in the layout slot, using `service.data.relatedArticles.title` as its visible heading and `getRelatedArticles(getPublishedArticles(), serviceId)` for cards.

- [ ] **Step 5: Run gates**

Run: `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm audit:page-images && pnpm audit:headings`
Expected: all exit 0; service detail HTML contains `[data-main-menu-hero]` with H1, intro, and exactly one `data-page-image`.

- [ ] **Step 6: Commit**

`git add src/content/services src/pages/services src/pages/en/services src/layouts/ServiceLayout.astro tests/service-content-frontmatter.test.mjs && git commit -m "feat(services): render service details from frontmatter blocks"`

---

### Task 5: Convert the 11 article entries and the article route

**Files:**
- Modify: `src/content/articles/*.md` (11 files)
- Modify: `src/pages/articles/[slug].astro`
- Modify: `src/layouts/ArticleLayout.astro`
- Test: `tests/article-content-frontmatter.test.mjs` (new)

**Interfaces:**
- Consumes: Task 2 `articleSchema.blocks`, `siteCrumb`, `PageHero`, `PageBlockRenderer`.
- Produces: `ArticleLayout` props `hero: HeroBlock`, `blocks: PageBlock[]`, `breadcrumbs`, `date`, `ogImage`, `alternates?`; it renders `PageHero` + date + `PageBlockRenderer` inside its existing reading container. Article route passes those props and no longer uses `<Content />`.

- [ ] **Step 1: Write the failing test**

`tests/article-content-frontmatter.test.mjs`:
- every article entry has empty body, exactly one `hero` block whose `title` equals `data.title`, and at least one `content-section`;
- article route source passes `hero` and `blocks` to `ArticleLayout` and contains no `<Content`;
- `ArticleLayout.astro` contains `PageHero`, `PageBlockRenderer`, `Breadcrumbs` with injected items, and no `<FeaturedImage` or hardcoded `"Beranda"`/`"Artikel"` labels.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm test`
Expected: FAIL.

- [ ] **Step 3: Convert article entries**

For each article, using its existing body:
- Add `hero` block: `id: hero-<slug>`, `title` = `title` field, `description` = `intro` field; no `image` (fallback to `featuredImage`).
- For every `##` heading create one `content-section` block: `id` = kebab-case of heading (prefix with the article id number if needed for uniqueness), `title` = heading text verbatim, `description` = the paragraph(s) immediately below it joined with a space.
- For Markdown lists, add an `items` entry per list item: `title` = the leading bold phrase when present, otherwise the first 3–6 words verbatim; `description` = the remaining text verbatim. For blockquotes, append the quoted sentence to the preceding section's `description`.
- Delete the Markdown body. Do not alter `title`, `intro`, `metaDescription`, `featuredImage`, `serviceId`, or dates.

- [ ] **Step 4: Refactor the layout and rewrite the article route**

In `src/layouts/ArticleLayout.astro`:
- Keep `Layout` + `Container as="article" variant="reading" gutter={false}`.
- Change props to `title, description, lang?, canonical?, ogImage?, imageAlt, date, alternates?, breadcrumbs?, hero: HeroBlock, blocks: PageBlock[]`; import `HeroBlock`/`PageBlock` types from `src/data/pages.ts`.
- Remove its own `FeaturedImage`, the hardcoded breadcrumb array, the `homeLabel`/`archiveLabel` constants, the `<div class="prose"><slot /></div>`, and the scoped `.prose` styles.
- Render `<Breadcrumbs items={breadcrumbs} />`, `{hero && <PageHero block={hero} fallbackImage={{ src: ogImage ?? "", alt: imageAlt }} />}` (keep `imageAlt` as an explicit prop), the `<time>` element with the existing `Intl.DateTimeFormat` logic, then `<PageBlockRenderer blocks={blocks} fallbackImage={...} />`.

In `src/pages/articles/[slug].astro`: remove `render` import and `const { Content }`; keep `ArticleLayout`. Pass `title`, `description`, `lang`, `canonical`, `ogImage`, `date={entry.data.updatedDate ?? pubDate}`, `imageAlt={featuredImage.alt}`, `alternates`, `breadcrumbs={[siteCrumb("/"), siteCrumb("/articles/"), { label: entry.data.title }]}`, `hero`, and `blocks` (all blocks except `hero`).

- [ ] **Step 5: Run gates**

Run: `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm audit:page-images && pnpm audit:headings && pnpm audit:seo`
Expected: all exit 0; every article page has one hero with H1, intro, and image; no heading skips.

- [ ] **Step 6: Commit**

`git add src/content/articles src/pages/articles src/layouts/ArticleLayout.astro tests/article-content-frontmatter.test.mjs && git commit -m "feat(articles): render articles from frontmatter blocks only"`

---

### Task 6: Global no-body gate, hero audit, and documentation

**Files:**
- Modify: `scripts/audit-page-images.mjs`
- Modify: `AGENTS.md`
- Modify: `docs/service-detail-frontmatter-design.md`
- Modify: `docs/components-blocks-layouts.md`
- Test: `tests/hero-route-audit.test.mjs` (new)

**Interfaces:**
- Consumes: Task 1 `validateFrontmatterOnlyEntries`, existing `findHeadingViolations` pattern.
- Produces: exported `isHeroRequiredRoute(route: string): boolean` from `scripts/audit-page-images.mjs`; CONTENT-014 enforced for all editorial entries; docs state the no-body rule.

- [ ] **Step 1: Write the failing audit test**

`tests/hero-route-audit.test.mjs`: `isHeroRequiredRoute("/services/sertifikasi-iso-9001-2026/")`, `"/en/services/iso-14001-2026-certification/"`, `"/articles/0001-posisi-kualitas-sebagai-talenta-kompetitif/"`, and `"/services/"` are true; `"/categories/quality-management/"` is false.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm test`
Expected: FAIL, export missing.

- [ ] **Step 3: Extend the audit and wire the no-body gate**

In `scripts/audit-page-images.mjs`, export `isHeroRequiredRoute` returning true for `mainMenuRoutes` and for `/^\/(?:en\/)?(?:services|articles)\/[^/]+\/$/`. Replace the `mainMenuRoutes.has(route)` condition with it and change the PAGE-HERO-001 message to “page must have one hero containing an H1, introductory paragraph, and featured image”. Guard the CLI-only execution so importing the module in tests does not scan `dist`.
In `src/content-validation.ts` import `validateFrontmatterOnlyEntries` and spread its result into `diagnostics` in `astro:build:done`. In `scripts/validate-changed-content.mjs` import it and include its results in `diagnostics`.

- [ ] **Step 4: Update documentation**

In `AGENTS.md`, replace the “body Markdown not rendered” limitation with: editorial `.md` files contain frontmatter blocks only and no body; this is enforced by CONTENT-014. In `docs/components-blocks-layouts.md` add the same rule and point to `/services/` as the canonical hero example. In the design doc change status from “waiting for approval” to “implemented”.

- [ ] **Step 5: Run the full verification set**

Run, in order, recording exit codes:
`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit:seo`, `pnpm audit:blocks`, `pnpm audit:page-images`, `pnpm audit:headings`, `pnpm validate:changed <base> HEAD` (where `<base>` is the branch point).
Expected: all exit 0; test count ≥ before; no CONTENT-014 diagnostics.

- [ ] **Step 6: Verify rendered UI**

Serve `dist` and measure `/services/sertifikasi-iso-9001-2026/` and one article at 1440×900 and 390×844 with the existing CDP script. Expected: `heroSection: true`, `heroHasH1: true`, `heroHasIntro: true`, `heroHasImage: true`, `primaryImages: 1`, `overflow: []`, H1 48px at 1440px.

- [ ] **Step 7: Commit**

`git add scripts/audit-page-images.mjs AGENTS.md docs tests/hero-route-audit.test.mjs && git commit -m "test(audit): require frontmatter hero on editorial detail routes"`

- [ ] **Step 8: Stop before integration**

Do not push, open a PR, merge, or delete branches. Report the final commit hash and validation evidence.
