# Components, Blocks, Layouts, and Styling Standards

## Components
- Components are focused, reusable presentation units with semantic, accessible markup.
- Prefer explicit typed props and clear reuse boundaries; avoid giant components and unnecessary micro-components.

## Blocks
- Blocks connect structured content to reusable components.
- Use a typed registry/renderer and discriminated schemas for validation.
- Blocks enable flexible section order when useful, but should not become a universal abstraction.
- Page composition may combine blocks and fixed layout elements.

### Page structure blocks (development mode)

`src/content/pages/*.md` may compose these page-structure blocks in addition to the shared `content-section`, `faq`, `howto`, and `cta` blocks:

- `hero`: eyebrow, title, description, and optional image/alt; `PageHero` falls back to the entry's featured image.
- `link-grid`: a short set of curated internal links with per-item eyebrow, title, description, and action label; rendered by `LinkGrid`.
- `listing`: a source selector (`services`, `trainings`, `schedules`, `articles`) plus heading and empty-state copy; `ListingSection` renders the shell while the route supplies item markup from the canonical collection.
- `contact`: heading, description, and label overrides; `ContactPanel` always reads email, phone, and address from `site.ts`.

This combined page pattern is provisional; do not treat it as a final universal layout abstraction.

## Layouts
- Choose layouts by page purpose, not convenience.
- Certification, article, training, schedule, and corporate pages should have distinct hierarchies and layouts.
- Shared header/footer/navigation may be reused while page structures remain purpose-specific.

## Styling
- Tailwind CSS is the primary workflow for layout, spacing, responsive behavior, and common styling.
- CSS custom properties are required for shared design tokens.
- Astro scoped/component-local CSS is allowed for distinctive or complex styling where utility classes are less readable.
- Avoid very long utility chains; extract a component or local style when clarity improves.
- Do not add Bootstrap or generic UI kits without explicit approval.
- Avoid AI-template aesthetics: gratuitous gradients, excessive rounded cards, repeated grids, shadows, blobs, generic icon tiles, and purposeless animation.
- Use composition, whitespace, typography, grids, borders, lists, and image placement intentionally.
- Respect responsive behavior, reduced motion, focus states, and keyboard accessibility.

## Naming and quality
- Use descriptive component names and semantic classes for custom CSS.
- Avoid inconsistent conventions and appearance-only class names.
- Keep styling scoped to avoid leakage.
- Design must feel authored for TNV, not assembled from a generic theme.

## Approved page layouts

The website maintains five purpose-specific layouts with one shared visual system:

- `WidePageLayout.astro`: homepage, corporate pages, and wide main-menu/index pages.
- `ServiceLayout.astro`: certification/service detail pages.
- `ArticleLayout.astro`: articles and editorial content.
- `TrainingLayout.astro`: training/course detail pages.
- `ScheduleLayout.astro`: schedule archive and schedule/batch detail pages.

The layouts may share the site shell, design tokens, and UI primitives, but must preserve distinct content hierarchy and user experience. Schedule pages must not be forced into an article or training layout.

## Approved visual direction

Use a premium, modern, mature, professional, corporate visual language. White is the dominant surface; very light gray is used sparingly; deep blue is reserved for deliberate emphasis. Orange, mint, yellow, and pink are restrained accents rather than section background themes.

Do not assign a different background color to every section. Establish hierarchy through whitespace, typography, grid, content width, image composition, borders, and restrained shadows. Main-menu pages use a wide composition and a consistent hero containing one H1, the introductory paragraph, and a featured image. Featured-image URLs must be unique across page URLs.

For the full requirements, phase sequence, and task-by-task progress checkboxes, see [Visual Redesign & Architecture Roadmap](./visual-redesign-roadmap.md).
