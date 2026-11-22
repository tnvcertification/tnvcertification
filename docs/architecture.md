# Astro Architecture Guidelines

## Editorial intro and SEO metadata validation

All publishable content entries (services/certifications, training, schedules, articles, and applicable pages) must use separate fields for the page introduction, SEO snippet, and primary-image alternative text. These fields serve distinct purposes and must not be copied verbatim from one another.

### Required fields and editorial format
- `intro`: exactly one introductory paragraph rendered immediately after the page's H1. It must explain the page's `title` and begin with the title followed by `adalah ...`. Example: “Sertifikasi ISO 9001 adalah standar sistem manajemen mutu yang membantu organisasi mengendalikan dan meningkatkan prosesnya.” Avoid generic or repeated intros across unrelated entries.
- `metaDescription`: a separate required SEO description. Write it for search-result context with a concise, persuasive, page-specific summary and relevant intent. It must not be identical to `intro` or `featuredImage.alt`. Character-length guidance (approximately 120–160 characters) should be a warning rather than a hard build failure; empty, duplicate, or verbatim-copy meta descriptions are errors.
- `featuredImage`: exactly one required primary image object. Its `alt` is required, must explain the page title using the word `adalah`, and must be shorter and more concise than the intro. Alt text should accurately describe the image/content and avoid generic labels or keyword stuffing.
- `images`: optional array of additional images. It does not replace or implicitly duplicate the required `featuredImage`.

### Build-time validation
Run content validation as part of the production build. Mandatory violations fail the build (non-zero exit status) and produce actionable diagnostics containing the content entry/path, field, rule identifier, and reason. Apply validation across every publishable content collection/type.

Recommended rule identifiers:
- `CONTENT-001`: H1 exists.
- `CONTENT-002`: exactly one intro paragraph appears immediately after H1.
- `CONTENT-003`: intro is non-empty and starts with the page title followed by `adalah`.
- `CONTENT-004`: intro explains the title and is not generic/reused across unrelated content.
- `CONTENT-005`: `metaDescription` is present and non-empty.
- `CONTENT-006`: `metaDescription` is unique across pages and is not an exact duplicate of intro or image alt.
- `CONTENT-007`: exactly one `featuredImage` object exists.
- `CONTENT-008`: `featuredImage.alt` is non-empty and title-relevant, using `adalah`.
- `CONTENT-009`: `featuredImage.alt` is shorter than intro.
- `CONTENT-010`: optional `images`, when supplied, is a valid array of image objects.

Meta-description length guidance should report warnings for unusually short/long values rather than failing solely on character count. Build validation must check the rendered/content source relationship between H1 and intro, not merely whether an arbitrary paragraph exists elsewhere.

## Core approach
- Build TNV Certification as a content-driven Astro website.
- Use Astro 7 or newer stable releases, subject to compatibility checks before upgrades.
- Use TypeScript 7 or newer stable releases, with strict type checking enabled.
- Use Tailwind CSS (latest stable compatible release) as the primary styling workflow.
- Keep content, data, presentation, composition, and layout responsibilities separate.
- Markdown files with frontmatter are the source of truth for editorial content.
- Use Astro Content Collections with schema validation.
- UI is composed from reusable components and content-selected blocks.
- Blocks map content data to components; they must not become a universal page layout.
- Keep the architecture understandable, maintainable, accessible, and extensible.

## Content model
Organize collections by content type, not visual layout. Recommended initial collections:
- certifications
- training
- training-schedules
- articles
- pages
Each collection should define a TypeScript schema using Astro's content APIs and Zod. Use frontmatter for metadata and structured content. Use Markdown body for long-form editorial content. Use MDX only when embedding components in editorial content is a real requirement.

## Layout flexibility
Do not force all pages into one layout. Choose layouts by purpose and content:
- Certification pages: service-focused layout with scope, benefits, process, FAQs, and next steps.
- Articles: reading-focused layout with readable typography, author/date metadata, and related content where useful.
- Training pages: course-focused layout with objectives, audience, curriculum, delivery, and registration details.
- Schedule pages: schedule/list-oriented layout with dates, status, modality, and registration.
- Corporate pages: flexible informational layouts.
Reuse components across layouts where appropriate, but preserve meaningful differences in hierarchy and user experience.

## Styling
- Tailwind CSS is the primary styling workflow for layout, spacing, responsive behavior, and common presentation.
- Centralize design tokens with CSS custom properties.
- Use scoped/component-local CSS for distinctive complex visuals when utility classes are not the clearest solution.
- Avoid excessively long utility chains; extract meaningful Astro components or reusable patterns when appropriate.
- Do not add Bootstrap or generic UI kits without an explicit decision.

## Visual identity and color system

The current approved visual direction is **premium, modern, mature, professional, and corporate**. This direction supersedes any earlier proposal for cheerful multi-color section backgrounds or frequent saturated color blocks.

### Core visual principles
- Use white as the dominant page surface.
- Use very light neutral gray sparingly to distinguish selected sections.
- Use deep blue for intentional emphasis such as selected hero or CTA surfaces; do not make every section a colored panel.
- Orange, mint, yellow, and pink are restrained accents for small highlights, badges, icons, or interaction states—not section background themes.
- Create visual hierarchy through whitespace, typography, grid, image composition, content width, alignment, subtle borders, and restrained shadows.
- Avoid giving every section a different background color.
- Avoid childish, school-project, template-like SaaS, or generic AI-generated visual patterns.
- Keep a consistent design language across all page types even when their layouts and content structures differ.

### Shared design system
Define and document reusable tokens and rules for:
- Typography scale, font weights, line heights, and readable text measure.
- Wide and reading container widths, responsive gutters, and breakpoints.
- Spacing scale and vertical rhythm.
- Brand colors, neutral surfaces, borders, and accessible contrast pairs.
- Buttons, links, badges, cards, section headers, image frames, and form controls.
- Focus states, keyboard interaction, reduced motion, and responsive behavior.

All layouts and reusable blocks must consume the shared design system rather than inventing unrelated visual rules.

### Image and hero direction
- Every main-menu page must have a purposeful hero containing one H1, its introductory paragraph, and a featured image.
- The hero composition may vary by page purpose, but its hierarchy, spacing, image treatment, and responsive behavior must remain consistent.
- Each page URL must use a unique featured-image URL. Do not reuse one image URL across different page URLs.
- Images must be relevant, credible, and appropriate to certification, auditing, training, industry, or corporate context.
- Never imply a stock/placeholder image depicts TNV staff, clients, facilities, or events.
- If a suitable authentic image is unavailable, use an explicitly neutral visual rather than a misleading representation.


## Rendering and data
- Avoid duplicating content in page templates.
- Prefer typed content and validated frontmatter.
- Use block arrays where a page needs flexible section ordering.
- Keep content authoring straightforward for Markdown editors.
- Components should receive explicit typed props rather than reaching into unrelated global state.

## Page entries in development mode

Main-menu and corporate page copy is authored in `src/content/pages/*.md` and selected through `src/data/pages.ts`. `routeOwnedPageSlugs` marks the slugs served by dedicated routes (`home`, `services`, `csms`, `trainings`, `schedules`, `articles`), so the generic `[slug].astro` does not emit duplicate paths. Routes resolve an entry, hand dynamic collections to `listing` blocks, and pass remaining blocks to the page block renderer. This pattern is provisional and preserves the existing route, navigation, and SSOT structure.

- `getPageEntry`, `getPageHero`, and `getPageBlocks` are the selectors routes use for page copy.
- Listing blocks describe their source and empty-state copy only; the route supplies cards/rows from the canonical collection.
- Company identity and contact values still come from `site.ts`; `contact` blocks carry only editorial labels and description text.
- Page entries are ID-only in this phase; EN paths are redirect stubs, and `routeOwnedPageSlugs` is also filtered out of the fallback generator.

### Known development-mode limitations

- Paginated article pages inherit title and description from the `articles` entry but keep their distinct `articles-archive-page-2.webp` primary image, because the page-image audit requires one unique primary image per canonical URL.
- Markdown bodies of block-only entries (`home`, `services`, `csms`, `trainings`, `schedules`, `articles`) satisfy the editorial schema but are not rendered yet; blocks supply the visible composition. Decide whether to render or drop those bodies before treating this pattern as final.
- `src/components/HomeHero.astro` is retained as a prop-only template for future hero variants; current routes render `PageHero`. It contains no page-entry copy.

## Shared content blocks across Service, Schedule, and Article

Service, Schedule, and Article content types may all use FAQ, HowTo, and CTA blocks. These are reusable content capabilities, not features exclusive to a single collection or layout. Their presence is optional and determined by the editorial purpose of each page.

### Shared block types
- `faq`: a structured list of question/answer items. It may render as an accessible accordion or another appropriate presentation. FAQ content can be used on Service, Schedule, and Article pages. Emit FAQPage JSON-LD only when the visible content and schema requirements are met; do not promise search rich-result eligibility.
- `how-to`: a structured set of procedural steps, optionally including step titles, descriptions, images, or links where supported by its schema. It can be used on Service (service process), Schedule (registration/attendance instructions), and Article (tutorials or guides). Do not force HowTo into content that is not instructional.
- `cta`: a reusable call-to-action block with validated variant, title/description, and button/link configuration. It can be used on Service, Schedule, and Article pages, with target and copy determined by page context. CTA configuration must not contain hardcoded company identity or contact details; resolve those through the central site configuration or canonical content records.

### Schema and rendering requirements
- Define each shared block as a discriminated block schema with its own validation, rather than a single permissive shape.
- Allow each relevant collection schema to include these shared block types, while retaining content-type-specific blocks and page layouts.
- Shared block data controls content and intent; components control semantic markup, accessibility, styling, responsive behavior, and presentation.
- Blocks remain optional and orderable within content composition where block arrays are used. Do not assume every page must contain FAQ, HowTo, or CTA.
- Reuse rendering components across content types while allowing layouts to preserve distinct page hierarchy and user experience.
- HowTo JSON-LD, if emitted, must describe visible step content and accurate supported details. Do not imply eligibility for Google HowTo rich results.
- Structured data should reflect the content actually rendered and should not be emitted merely because a block schema exists.

## Schema.org structured data for Service pages

Service detail pages (for example, `/services/<slug>/`) use Schema.org's `Service` as the primary structured-data entity. Services are professional certification/audit services, not physical products; do not use `Product` as a substitute.

### Recommended JSON-LD graph
Generate JSON-LD programmatically from canonical content and the central `site.ts` configuration. A service detail page should normally emit a graph containing:
- `Service`: primary service entity.
- `WebPage`: the page itself, with its canonical URL and main entity reference.
- `BreadcrumbList`: Home → Service index → current service.
- `FAQPage`: only when valid FAQ content is present, visible on page, and schema requirements are met.

Optionally emit `HowTo` for a service process only when it is genuinely instructional and the structured data describes the visible, eligible procedure. Do not automatically mark every process/step list as HowTo.

### Service entity properties
Populate supported fields using real canonical data:
- `@id`: canonical service URL + `#service`.
- `name`: service title/name.
- `description`: service-specific description.
- `url`: canonical page URL.
- `image`: required primary featured image URL.
- `serviceType`: specific service/certification type.
- `category`: service category, when provided.
- `provider`: reference to the site's canonical Organization entity using its `@id`.
- `areaServed`: supported service coverage (e.g. Indonesia) only when confirmed by canonical configuration/content.

### Entity graph and source of truth
- The provider Organization must be declared centrally (using `site.ts` as SSOT) and referenced by `@id`; do not duplicate company identity or contact data per service.
- Canonical IDs should be consistent across the site (Organization, WebSite, WebPage, Service, BreadcrumbList, FAQPage).
- The JSON-LD graph must be built from data actually rendered; omit unsupported or absent optional fields rather than fabricate them.
- Service index `/service/` may emit `CollectionPage`, `ItemList`, and `BreadcrumbList` to represent its listing, as appropriate.
- Service page FAQ JSON-LD is semantically useful but does not guarantee FAQ rich results; Google currently limits FAQ rich-result display eligibility.
- Training pages may use `Course` when their content genuinely represents a course/program. Individual training schedules may use `Event` only when they represent real event instances with sufficient accurate data. Use neither type mechanically.
- Articles should use `Article` or `BlogPosting` and relevant page/breadcrumb entities as appropriate.
- Structured data must be validated and must not contain fabricated claims, times, dates, prices, locations, or eligibility.

## Content image model

Every publishable content entry must have exactly one primary image through `featuredImage`. An optional `images` array provides additional images; it is not a replacement for the required primary image.

- `featuredImage`: required single image object (never an array). Used as the default visual representation for content cards/listings, page hero/cover where the layout calls for it, and Open Graph/social sharing image where appropriate.
- `images`: optional array of additional image objects for galleries, supporting visuals, documentation, or content-specific image sections. It may be omitted or empty
- Use a consistent validated image-object schema across content collections. Store appropriate image metadata such as source/path, meaningful alt text, and optional caption where supported. Avoid duplicating image metadata structures across collection schemas.
- Keep the featured image conceptually distinct from the optional gallery. Do not automatically repeat the featured image inside `images`; if the same asset is intentionally included there, document/render it without unintended duplicate presentation.
- Content schemas must validate that `featuredImage` is present and is a single image object. Validate `images`, when supplied, as an array of image objects.
- Presentation is context-specific: the featured image can be shown as a hero, cover, card thumbnail, or social preview, but do not force every page layout to display it in the same way. Optional `images` should only be rendered when the page composition calls for them.
- Use responsive image handling and appropriate dimensions/format optimization. Alt text should describe meaningful visual content; use empty alt only for decorative images in the rendered context where appropriate.

## Maintainability
- Keep components focused and reusable; avoid giant components.
- Use semantic HTML and accessible headings, landmarks, links, and controls.
- Document architecture exceptions in the relevant docs.
- Keep dependencies lean; introduce packages only when they solve a concrete need.

## Contextual footer

The website uses one reusable footer component with two rendering modes: a default footer and a service-contextual footer. Do not create separate hardcoded footer components for individual service pages or articles.
- Default footer: used on general pages and articles without a valid service relationship. It includes company information, general navigation/contact information, and a general CTA.
- Service footer: used on a service page, or on an article linked to a service. It may include a service-specific claim and CTA that link to the related service.
- Service pages resolve footer context from their own service data.
- Articles may optionally declare `serviceId` in frontmatter. This is a foreign-key-style reference to the canonical service record; the article must not duplicate the service name or claim text.
- When an article has a valid `serviceId`, resolve the service and render its contextual footer. When `serviceId` is absent or cannot be resolved, fall back safely to the default footer.
- Footer claims must be accurate, natural, and based on the resolved service. Example: “PT. Intiprima Sertifikasi menyediakan layanan Sertifikasi ISO 9001.” Do not hardcode service names or company claims into components.
- Company identity and shared company information must come from the central `site.ts` configuration (single source of truth). Service metadata and optional service-specific claim copy should come from canonical service data.
- Keep footer presentation separate from the context-resolution/data logic. Use a typed resolver or equivalent clear logic to resolve the footer context.

## Article metadata and service relationship

Article frontmatter may include:
- `pubDate`: original publication timestamp, in valid ISO 8601 format.
- `updatedDate`: timestamp of the latest meaningful editorial/content update, in valid ISO 8601 format; optional.
- `serviceId`: optional numeric identifier referencing a canonical service record.
- Other editorial metadata (such as author, category, tags, draft status, and content blocks) should be validated through the collection schema.

Treat `serviceId` as a service reference, not as duplicated service content. Resolve the ID against the canonical service dataset. If no matching service exists, do not invent a relationship or contextual claim; use the default footer as fallback.

## Training frontmatter and page composition

Training content is a canonical program/course page, not a schedule record. The observed frontmatter structure includes:
- Identity: `id`, `ulid`, `trainingSlug`, and `slug`.
- Content/SEO metadata: `title`, `description`, `pubDate`, `updatedDate`, and `draft`.
- Categorization: `categoryIds` referencing the canonical category dataset.
- Hero metadata: `hero` object (headline, eyebrow, description, image alternative text, CTA, delivery mode, duration, and other optional fields).
- Trust indicators: optional `hero.trustItems`.
- Page composition: `blocks`, validated by block type and block-specific schema.

### Training blocks and schedules
- Training `blocks` control page section composition and must be schema-validated by discriminated block type.
- The `training-schedule-list` block is a display/configuration block (e.g. heading, eyebrow, empty state, and list anchor), not the schedule data itself.
- Schedule records are loaded from the separate `training-schedules` collection and associated to a training using `trainingSlug`. Do not duplicate schedule dates, pricing, quotas, registration state, or venue in the training frontmatter.
- Training blocks may include `training-content-section`, `training-summary`, `training-detail-intro`, `training-cta`, `training-faq`, and `training-schedule-list`. Maintain a type-specific schema for each block and avoid one overly permissive schema.
- The training example contains `categoryIds`, but no `serviceSlug`. Do not infer a service relationship from a category ID or assume every training belongs to a service. If a service relationship is needed, add an explicit canonical relationship field and define its ownership/derivation before implementation.

## Schedule CSV import workflow

The schedule CSV is the operational source used to author and maintain training batches. A validated import converts each complete row into one schedule Markdown/frontmatter entry in the Astro `training-schedules` collection. The CSV is the authoring input; generated frontmatter is the website's content representation. Keep the importer deterministic and do not manually edit generated schedule files unless the workflow explicitly supports reverse-sync.

Recommended source file: `src/data/schedules/schedules.csv`.

### CSV columns

Use this exact header and order:

```csv
ID,serviceSlug,trainingSlug,startDate,endDate,timezone,locationType,venue,city,province,registrationStatus,price,currency,quota,registrationUrl,notes
```

### Service and training relationships
- `serviceSlug` is optional and references a canonical service by its stable slug; it provides service context/category for a schedule where relevant.
- `trainingSlug` is required for every publishable schedule and references the actual training/course entry the schedule belongs to.
- Service and training are distinct content entities. A service may have no training schedule, and a training can exist without a service association.
- Validate `serviceSlug` and `trainingSlug` independently against their respective canonical collections. Do not duplicate service title, service description, or service metadata into schedule CSV/frontmatter.
- Do not require `serviceSlug` to be populated merely because a schedule exists.

- `ID` (required): stable numeric identifier for a schedule/batch; also used for its photo directory.
- `serviceSlug` (optional): foreign-key reference to a canonical service entry, when the schedule has a service context.
- `trainingSlug` (required): foreign-key reference to the canonical training collection entry for the actual course/batch.
- `startDate`, `endDate` (required for a publishable schedule): ISO date `YYYY-MM-DD`.
- `timezone` (optional): IANA timezone; default `Asia/Jakarta`.
- `locationType` (optional): `offline`, `online`, or `hybrid`.
- `venue`, `city`, `province` (optional): venue and location details.
- `registrationStatus` (optional): `open`, `closed`, `full`, or `cancelled`; define a documented default if blank.
- `price` (optional): numeric amount only, no currency symbols; zero means free, blank means price not provided.
- `currency` (optional): ISO 4217 currency code; default `IDR`.
- `quota` (optional): positive integer; blank means unknown.
- `registrationUrl` (optional): registration link.
- `notes` (optional): schedule-specific notes.

### Import and validation behavior
- Treat blank CSV cells as null/omitted values, not as zero, false, or an invented value.
- Keep incomplete rows (for example, a row with ID and trainingSlug but no dates) in the CSV as planning records, but do not generate/publish them as schedule content.
- Report skipped/incomplete rows with their row number and ID. Invalid values (duplicate IDs, unknown trainingSlug, malformed dates, endDate before startDate, invalid enum values, malformed URL, nonnumeric price/quota) must produce actionable validation errors.
- Require `ID` uniqueness; preserve it when dates, price, venue, or status change.
- Validate `trainingSlug` against the canonical training collection.
- Never infer event times from date-only values.
- Importer should be deterministic: identical valid CSV data and source content should produce the same frontmatter values, without build-time timestamps.
- Generate schedule files keyed by ID (e.g. `3084.md`) and keep schedule photo paths keyed by the same ID.
- Do not publish a row until both dates and required relationship fields validate.
- Formatting (currency, date labels, CTA text) belongs in UI/rendering code, not in the CSV.
- The importer should not silently turn missing price into free registration or missing quota into unlimited capacity.

### CSV-to-frontmatter mapping
Map CSV fields to frontmatter as follows: `ID` → `id`; `serviceSlug` → `serviceSlug` (optional service context); `trainingSlug` → `trainingSlug`; `startDate`, `endDate`, `timezone`, `locationType`, `venue`, `city`, `province`, `registrationStatus`, `price`, `currency`, `quota`, `registrationUrl`, and `notes` retain their names. Publication metadata such as `pubDate`, `updatedDate`, `draft`, and URL slug may be generated/managed separately and must not be fabricated from the schedule dates.

Example CSV planning row (not publishable until dates are supplied):

```csv
3083,,ahli-higiene-industri-utama-hiu,,,,,,,,,,,,,
```

Example generated frontmatter for a complete row:

```yaml
---
type: schedule
id: 3084
trainingSlug: operator-boiler-tingkat-1
startDate: "2026-12-14"
endDate: "2026-12-22"
timezone: "Asia/Jakarta"
locationType: offline
venue: "Training Center"
city: "Jakarta"
province: "DKI Jakarta"
registrationStatus: open
price: 4500000
currency: IDR
quota: 20
registrationUrl: "https://example.com/register"
notes: "Sesi praktik perlu dikonfirmasi"
---
```
The importer must preserve blanks as absent fields. The frontmatter schema should enforce the publishable schedule requirements while optional location, registration, pricing, and quota fields remain optional.

## Schedule content type

Schedule content represents an event/batch occurrence (for example, a training batch), and is distinct from the training/course page and from an article. Validate its frontmatter through a dedicated collection schema.
Schedule frontmatter may include:
- `startDate`: event start date, formatted as an ISO 8601 date (`YYYY-MM-DD`); source of the event start date for UI and JSON-LD structured data.
- `endDate`: event end date, formatted as an ISO 8601 date (`YYYY-MM-DD`); source of the event end date for UI and JSON-LD structured data.
- `dateLabel`: human-readable date text for display, such as “14–18 & 22 Desember 2026”; do not use this display string as the machine-readable event date.
- `timezone`: IANA timezone identifier for the event (e.g. `Asia/Jakarta`).
- `pubDate`: content publication timestamp, in valid ISO 8601 format.
- `updatedDate`: timestamp of the latest meaningful update to this schedule content, in valid ISO 8601 format; optional.
- `status`: schedule lifecycle/status used by display and application logic (validate allowed values in the collection schema).
- `scheduleId`, `publisherId`, `trainingSlug`, `batchNo`, and `slug`: identifiers and references used to identify the schedule, publisher, related training, batch, and URL.
- `delivery`: delivery mode and attendance mode, validated against allowed values.
- `venue`: venue/location metadata; avoid implying a venue is confirmed when the content says it requires confirmation.
- `sites`: per-site publishing/visibility configuration, validated by schema.

### Schedule dates versus publication dates
- `startDate` and `endDate` represent the actual event dates and are the source of event date values in JSON-LD (such as an Event's `startDate` and `endDate`).
- `pubDate` and `updatedDate` represent the schedule page/content publication and editorial update timestamps. They must not be substituted for event dates.
- `dateLabel` is display-only; use the ISO event date fields for structured data and date logic.
- Respect the schedule's `timezone` when generating date/time values or interpreting event dates. If frontmatter provides date-only values, do not invent event start/end times.
- For JSON-LD, map event dates from `startDate`/`endDate` and location/delivery details from schedule metadata only when appropriate and supported by the data. Do not emit unsupported or unconfirmed details as definitive event facts.
- Keep schedule status distinct from dates: a past event, draft, cancelled, or otherwise unavailable schedule must not be represented as an upcoming, bookable event solely because its metadata exists. Validate status values and define their display/structured-data handling explicitly.
- A multi-day schedule can have non-consecutive class days (as shown by `dateLabel`); `startDate` and `endDate` still describe the overall event range. Preserve the explicit `dateLabel` for communicating session dates, and do not infer missing session days from the date range.

## Sitemap lastmod

Generate sitemap `lastmod` from actual content metadata rather than build/deploy timestamps.
- For articles and schedules, use `updatedDate` when present; otherwise fall back to `pubDate`.
- For other content types, use their own real modification metadata when available; define an explicit fallback appropriate to that content type.
- Do not set `lastmod` to the current build time or deployment time.
- Keep timestamps valid and consistent in ISO 8601 format, including timezone information where available.
- Only change `updatedDate` when meaningful content changes occur; avoid false freshness signals.

## Semantic heading hierarchy validation

Every publishable content page must use a sequential semantic heading hierarchy. Heading levels must not skip levels when moving deeper into the document.
Allowed progression:
- H1 → H2
- From any heading, moving back to a higher-level heading (a numerically smaller level) is permitted when structurally appropriate.
- H2 → H2 or H3
- H3 → H3 or H4
- H4 → H4 (or move back to H1, H2, or H3 as appropriate)

Invalid jumps include H1 → H3, H1 → H4, H2 → H4, and any transition that descends by more than one heading level. Headings must represent the document outline, not be chosen for visual styling.

### Build validation

Validate heading hierarchy from the parsed Markdown/content AST or rendered document structure, not fragile raw-text matching. A hierarchy violation is a hard build error with the content entry/path, heading text, actual level, expected level(s), and a rule identifier.
Recommended rule identifier:
- `CONTENT-011`: semantic heading levels must not skip (e.g., H1 cannot be followed directly by H3/H4; H2 cannot be followed directly by H4).

This validation applies to all publishable content collections and page content that supports headings. The production build must exit non-zero if any violation is found.

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
