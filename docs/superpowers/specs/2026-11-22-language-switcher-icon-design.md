# Language switcher flags — short design

**Date:** 2026-11-22
**Status:** Approved (revised after build review)
**Size:** Small change
**Approved approach:** Indonesia flag + United Kingdom flag

## Intent

The owner found `Bahasa Indonesia` and `English` too long in the header. A first implementation used globe icons with `ID`/`EN` codes; after reviewing the built header, the owner said the two globes looked too similar and asked for flags instead. Flags give an immediate visual distinction at a small size.

## Goals

- Replace the visible labels of both options with small inline SVG flags: red/white for Indonesia, Union Jack for English.
- Keep the option names available to assistive technology via `aria-label` (active link) and `sr-only` text (disabled option), sourced from `siteSettings.languages`.
- Keep `aria-current="page"`, `aria-disabled="true"`, the localized explanation, ≥44px targets, and the existing `border-b-2` states unchanged.
- Keep the URL as the only language state: no JS, storage, detection, or redirect.

## Non-goals

- No change to `src/lib/locale-switch.ts`, `src/data/locale-switch.ts`, or counterpart rules.
- No new dependency or external icon library; inline SVG only.
- No new English content or change to fallback stubs.
- No claim that a flag represents a language perfectly; it is a compact visual affordance, while accessible names remain authoritative.

## Constraints

- `site.ts` remains the SSOT for all strings; no hardcoded site-wide copy in the component. Flag colors are visual assets, not copy.
- SVG is decorative inside an already-labelled control: `aria-hidden="true"` and `focusable="false"` on each SVG.
- Disabled option keeps its full name and explanation in `sr-only`; do not override it with `aria-label`.
- Work from `upstream/main`; fork `main` is used for preview because the owner explicitly asked to see the build before the PR, then re-synced after merge.

## Approaches considered

1. **Globe + `ID`/`EN` code** — implemented first, then rejected after build review: at 24px the two globes looked nearly identical and the code was not visually distinctive.
2. **Indonesia + United Kingdom flags (chosen)** — instantly distinguishable, bold shapes that survive small sizes, familiar in international certification/business context. Trade-off: a flag is a country symbol, not a language symbol.
3. **Indonesia + United States flags** — widely recognized but busier and more politically loaded. Rejected.
4. **Flag plus code** — clearest but more complex and noisier than the requested compact icon. Rejected.
5. **Single globe toggle to the other language** — rejected earlier; collapses two explicit options and hides the active state when no counterpart exists.

## Design

- `src/components/LanguageSwitcher.astro` keeps its structure and imports a new typed `src/components/LanguageFlag.astro`; no other product files change.
- Available option: keep the `<a>` with `href`, `aria-label={option.label}`, `aria-current`, classes, and focus ring; replace the globe SVG with `<LanguageFlag lang={option.lang} />`.
- Unavailable option: keep the `<span aria-disabled="true">` with its classes; render `<LanguageFlag lang={option.lang} />` followed by `<span class="sr-only">{option.label} — {unavailableText}</span>`.
- `LanguageFlag.astro` takes a `lang: string` prop: `lang === "id"` renders the red/white Indonesia flag (`viewBox="0 0 24 12"`); every other lang renders the Union Jack (`viewBox="0 0 60 30"`).
- ID flag: red `#CE1126` upper band, white `#FFFFFF` lower band, and a thin `currentColor` outline so the white band is visible on light headers.
- EN flag: simplified Union Jack using blue `#012169`, white `#FFFFFF`, and red `#C8102E`, plus the same thin outline.
- Both SVGs: `class="h-4 w-6"` (24×16 CSS box), `aria-hidden="true"`, `focusable="false"`. The 2:1 flag art is letterboxed vertically by the SVG default `preserveAspectRatio`, so it stays undistorted. No text nodes, no `toUpperCase()`, no globe shapes.
- After build review, the owner asked for a smaller flag and tighter spacing: the switcher uses `gap-0` and `px-2.5`. With a 24px flag and 10px padding per side, each option is 44px wide and keeps `min-h-11` for a 44px-tall target; the visual gap between flags drops from 28px to 20px.
- The markup guard test checks that the switcher has no inline SVG and uses the flag component twice; that the flag component has two decorative SVGs with both color sets; that sizes and spacing match; and that accessible names and visible-label absence still hold.

## Delivery workflow

1. Fetch and verify `upstream/main`; keep the dedicated branch on that base.
2. Commit the flag change, push fork `main` for preview, and push the PR head branch.
3. PR #23 (`skyforgged:feat/language-switcher-icons` → `tnvcertification:main`) is updated by the new commit.
4. After merge, re-sync fork `main` with upstream.

## Verification

- `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit:seo`, `pnpm audit:blocks`, `pnpm audit:page-images`.
- Inspect `dist` HTML: active link has `aria-label` from `site.ts`; exactly one switcher `aria-current="page"`; disabled option has `aria-disabled="true"` and `English — Terjemahan belum tersedia`; both SVGs are `aria-hidden`/`focusable="false"`; no visible full labels; no switcher href points to a fallback stub.
