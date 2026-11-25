# AGENTS.md

## Project mission
Build and maintain the PT. Intiprima Sertifikasi website as a polished, content-driven, accessible, SEO-conscious Astro site. Avoid generic AI-generated design patterns and unnecessary complexity.

## Work rules
- Read relevant existing code and documentation before changing it. Follow the established patterns unless there is a concrete reason to improve them.
- Commit directly to `main` only when working in the upstream repository (`tnvcertification/tnvcertification`). When working in a fork, create a branch from the latest `upstream/main`, commit there, and open a pull request against upstream `main`; do not commit fork work directly to the fork's `main`.
- Keep changes focused. Do not rewrite unrelated files, introduce speculative abstractions, or add dependencies without a clear need.
- Report what changed, validation performed, and any validation that could not be run. Never claim tests/builds succeeded without actually running them.
- Before merge, release validation, push, or merged-branch deletion work, read `docs/agent-operational-memory.md`.

## Source of truth and content
- Treat `site.ts` as the single source of truth (SSOT) for company identity, contact details, addresses, shared site settings, and other company-wide information.
- Do not hardcode company/site-wide information in components, pages, layouts, navigation, footer, SEO metadata, CTAs, or contact sections. Read it from the central configuration.
- Content belongs in validated content collections, not duplicated in presentation code.
- Use stable canonical identifiers/relationships; do not infer relationships from labels, categories, or similar-looking slugs.
- Keep Service, Training, Schedule, Article, and Category as distinct content entities. A schedule must reference its training; service association is optional and explicit.

## Page content source of truth (development mode)

This combined pattern is still in development and is not a final architecture decision. It borrows the markdown-page approach from the reference project while keeping the existing routes, navigation, validation, and `site.ts` SSOT intact.

- Editorial copy for the main page surfaces (`home`, `services`, `csms`, `about-us`, `trainings`, `schedules`, `articles`) lives in `src/content/pages/*.md`; `.astro` files must not own editorial page copy.
- Astro routes only resolve the entry, pass dynamic data (services, trainings, schedules, articles) into blocks, and choose layout/presentation. Dynamic records stay in their own collections; do not duplicate them into page frontmatter.
- `site.ts` remains the single source of truth for company identity, contact details, navigation, and shared settings. Page frontmatter must not duplicate those values; components read them from `site.ts`.
- `src/data/pages.ts` exports the shared selectors and `routeOwnedPageSlugs`; dedicated routes own their slugs and the generic `[slug].astro` must skip them.
- Blocks are discriminated and typed: `hero`, `link-grid`, `listing`, `contact`, plus the existing `content-section`, `faq`, `howto`, and `cta`. See `docs/components-blocks-layouts.md`.
- Editorial `.md` entries (pages, services, articles) contain frontmatter blocks only and no Markdown body. A re-added body is rejected at build time and in changed-content preflight by CONTENT-014. Author the H1, intro and featured image as a `hero` block; `/services/` is the canonical example.
- Page entries are no longer ID-only: English entries exist for Home, CSMS, and About us, while Services keeps its earlier English pages and the remaining menu routes stay redirect stubs.

## Editorial purpose and research standard

- Build the website as a genuinely useful source of information, not a service catalogue or a collection of SEO pages.
- Never publish internal conversations, AI instructions, strategy notes, corrections, workflow discussion, or development-process commentary as public content. Keep those in agent or operational documentation.
- Research must be turned into substantive, accurate page content, not left as bare references or links. External sources are research inputs, never competitor backlinks.
- Service pages must aim to be complete information hubs. The required depth, topic coverage, and SEO behaviour are defined in `docs/content-editorial-standards.md`.
- Do not chase rankings through arbitrary length, keyword repetition, or near-identical pages. Prioritise accuracy, relevance, trust, semantic structure, and consistent topical authority.

## Mandatory editorial content rules
- Every publishable content entry must have an introductory paragraph directly after its H1. The intro is exactly one paragraph and must explain the page title, beginning with the title followed by `adalah ...` (for example, `Sertifikasi ISO 9001 adalah ...`). Do not use generic or repeated intro copy across unrelated pages.
- `metaDescription` is a required, separate SEO field. It must be unique, persuasive, relevant to the page, and must not duplicate the intro or featured-image alt text.
- Every publishable content entry must have exactly one `featuredImage` object. Its `alt` is required, explains the page title using `adalah`, and is shorter and more concise than the intro. Avoid generic alt text and keyword stuffing.
- Additional `images` are optional and do not replace `featuredImage`.
- Enforce required content rules at build time. Invalid content must fail the build with actionable file/field/rule diagnostics; do not treat mandatory rule violations as warnings.
- Enforce semantic heading hierarchy at build time: heading levels must progress without skipping (H1 → H2 → H3 → H4). For example, H1 may be followed by H2, H2 may be followed by H3 or H2, and H3 may be followed by H4, H3, or a higher-level heading. H1 → H3, H2 → H4, and any other downward level jump are invalid and must fail the build. Heading hierarchy must be validated from the content/rendered document structure, not by string matching.

## Business positioning and absolute content restrictions

- The company website represents a certification body / certification service provider. Its public positioning is certification, audit, assessment where formally authorized, and related certification administration only.
- **ZERO CONSULTATION: the word family and concept are prohibited in all public-facing website content.** Do not use Indonesian forms beginning with `konsult` or English forms beginning with `consult`, including headings, paragraphs, FAQs, metadata, image alt text, CTA labels, button labels, navigation, forms, training pages, schedule pages, service pages, structured-data descriptions, and reusable component copy.
- Do not offer consulting, advisory, implementation assistance, system-document preparation, or implementation mentoring. Do not imply these activities are part of certification services.
- CTA language must focus on certification applications, certification information, audit processes, certification status, or administrative requirements. Preferred wording includes “Ajukan Sertifikasi”, “Informasi Sertifikasi”, and “Hubungi Kami” where appropriate.
- Describe audit and certification activities accurately and independently. Never imply that the certification body implements or advises on the management system it audits.
- Treat this policy as a build-blocking editorial requirement for both published entries and drafts. Every new or edited content entry must comply before commit.
- **NO INTERNAL SERVICE-STATUS COPY: internal development-status, service-availability, and self-audited authorization disclaimers are prohibited in every content entry, published or draft.** Describe certification scope, requirements, and audit process in factual public language instead. Validators, tests, plans, and specs must not require, restore, or generate these blocks. Content validation rejects the pattern as a class.

## Stack and conventions
- Astro 7+ stable (confirm actual compatibility and release status before upgrades).
- TypeScript 7+ stable, strict typing.
- Tailwind CSS latest stable compatible with the chosen Astro/TypeScript versions.
- Use Astro Content Collections with Zod schemas for validation.
- Prefer Astro components and typed props; keep dependencies lean.
- Use semantic HTML, accessible labels, keyboard navigation, appropriate heading hierarchy, and responsive behavior.
- Tailwind is the primary styling tool. Use CSS custom properties for design tokens and scoped CSS for distinctive complex visuals when utilities are not the clearest choice.
- Do not introduce Bootstrap, generic UI kits, or heavy client-side frameworks without an explicit architectural decision.

### Native compiler binding incident (2026-11-25)
- Symptom: `astro sync`, `astro build`, `pnpm check`, and the full gate exited with `Illegal instruction` (SIGILL, status 132) on a host whose CPU lacks AVX2/BMI (observed on Intel Xeon E5-1410 v2). Loading `astro.linux-x64-gnu.node` by itself reproduced the crash.
- Root cause: `@astrojs/compiler-binding-linux-x64-gnu@0.5.3` contains BMI1/BMI2 instructions that the host cannot execute. Versions 0.4.1 through 0.5.2 load on that CPU. The separate `@bruits/satteri-linux-x64-gnu` binding is unaffected.
- Resolution: `pnpm-workspace.yaml` overrides `@astrojs/compiler-binding` to `0.5.2`, and `pnpm-lock.yaml` is updated to match. Keep the override in `pnpm-workspace.yaml`; pnpm 12 ignores `pnpm.overrides` in `package.json`.
- Earlier workaround: validation and commits were run from the main checkout instead of the native worktree. That path-based workaround is obsolete because the worktree `node_modules` links to the main checkout, so both paths resolve the same binding.
- If SIGILL appears again, verify the resolved binding version and the platform binary before changing site code. Confirm the pin with `pnpm install --frozen-lockfile` and a full gate run.

## Content architecture
- Keep content, data, validation, presentation, composition, and layout responsibilities separate.
- Use separate, type-specific collection schemas. Use discriminated schemas for blocks; avoid permissive catch-all objects.
- Reusable content blocks can be shared across content types when the data model and editorial purpose match.
- Service, Schedule, and Article may all use FAQ, HowTo, and CTA blocks. These blocks are optional and should not be forced into every page.
- Keep layouts specific to page purpose. Shared components must not flatten meaningful differences between service, schedule, article, training, and corporate pages.
- Structured data (JSON-LD) must accurately reflect supported, visible page content. Never fabricate dates, prices, availability, event times, locations, claims, or relationships for SEO.
- Use actual publication/update metadata for sitemap `lastmod`; never use build or deploy timestamps.

## Service Schema.org markup policy
- Service detail pages (`/services/<slug>/`) use Schema.org `Service` as the primary entity; do not substitute `Product` for professional certification/audit services.
- Generate a JSON-LD graph from validated canonical content and central `site.ts` settings, typically including `Service`, `WebPage`, and `BreadcrumbList`.
- Add `FAQPage` only when valid FAQ entries are actually rendered and supported. FAQ markup is semantically useful but must not promise Google FAQ rich results.
- Add `HowTo` only for genuinely instructional, visible procedures that meet schema requirements; do not automatically map every service process list to HowTo.
- `Service` fields should use factual data: `@id` (canonical URL + `#service`), `name`, `description`, `url`, `image` (featured image), `serviceType`, `category` when present, `provider` referencing canonical Organization `@id`, and `areaServed` only when supported by configuration/content.
- Define the canonical `Organization` entity once from the central `site.ts` SSOT; reference it by `@id` instead of duplicating company identity on service pages.
- Service index may use `CollectionPage`, `ItemList`, and `BreadcrumbList`; training may use `Course` when appropriate; schedules may use `Event` only for real event records with accurate details; articles may use `Article`/`BlogPosting`. Do not emit schemas mechanically.
- Structured data must mirror visible content and omit unsupported optional fields. Validate JSON-LD output.

## UI and design quality
- Prioritize intentional typography, spacing, composition, visual hierarchy, and brand credibility.
- Avoid template-like hero layouts, excessive cards, gradients/glows, gratuitous icons, repeated rounded boxes, and overlong utility-class chains.
- Design responsively, but preserve the intended composition across breakpoints rather than merely stacking everything.
- Use imagery only where it adds meaning; ensure alt text is useful and not redundant.
- Ensure interactive elements have clear affordances, focus states, and adequate contrast.
- Visual direction: use a lively but corporate palette. Distinguish consecutive content sections with intentional background-surface variation—brand blue, deep navy, mint, warm cream, soft coral/orange, and clean white—while keeping text contrast accessible. Use one dominant surface color per section, restrained accents, consistent spacing, and clear typography. The page should feel energetic and welcoming without looking playful, noisy, or like a generic SaaS landing page.
- Preserve a professional, credible, energetic, modern, and human brand feel. Avoid generic SaaS/AI landing-page styling, excessive cards, gradients/glows, and decorative color noise.

## Validation and delivery
- Before committing, inspect the diff and check for accidental unrelated changes.
- Run available checks (typecheck, lint, build, tests) that are relevant and present in the repository; do not invent scripts.
- Summarize the work and provide the commit hash after a successful commit.
- If requirements conflict or the existing architecture is unclear, inspect first and ask only the necessary clarifying question.

## Article discovery and contextual article sections
- Homepage (`/`): render an **Artikel Terbaru** section before the footer, showing the first 3 published/valid articles after sorting by `updatedDate DESC` (global ranks 1–3).
- Service index (`/service/`): render an **Artikel Terbaru** section showing global ranks 4–6 from the same sorted article list. Do not repeat ranks 1–3 shown on the homepage.
- Service detail (`/services/<slug>`): render an **Artikel Terkait** section filtered to articles whose explicit `serviceId` matches the canonical ID of the current service. Sort matching articles by `updatedDate DESC`. Do not infer associations from categories, titles, or slugs.
- Only published, valid articles are eligible for these sections; draft/invalid articles must never appear. When `updatedDate` is missing, use `pubDate` as a documented sort fallback. For deterministic ordering when timestamps match, sort by `pubDate DESC`, then stable article ID/slug ascending.
- Keep these article selection rules in shared data/query logic rather than duplicating sort/filter logic in page components. Homepage and service-index article lists must use the same sorted result so their rank windows remain consistent.
- The number of articles in the service-detail related section is a presentation/configuration choice; do not assume an arbitrary limit unless explicitly set.

## Article archive listing and pagination
- The `/articles/` archive page displays published, valid articles as article cards in a responsive grid: 3 columns on desktop, 2 on tablet, and 1 on mobile.
- Use a page size of 9 articles (3×3 grid) per page.
- Cards use the article's single `featuredImage`, category when available, title, intro/excerpt, updated date, and a clear link to the article. Keep card markup semantic and links keyboard-accessible.
- Use the same canonical published-article dataset and ordering as the homepage and service index: effective update date descending (`updatedDate`, falling back to `pubDate`), then `pubDate DESC`, then stable ID/slug ascending.
- Pagination is generated dynamically from the number of eligible published articles. Do not emit empty or out-of-range pages. First page canonical URL is `/articles/`; subsequent pages use `/articles/page/2/`, `/articles/page/3/`, etc.
- Pagination links must be crawlable HTML anchors (Previous, page numbers, Next), with the current page clearly indicated and appropriately marked for assistive technology. Disable/omit Previous on the first page and Next on the last page. Provide correct page-specific metadata/canonical handling; do not canonicalize every page to the archive root.
- The grid must adapt to screen sizes without forcing three columns on narrow viewports.
