# Language switcher icons — short design

**Date:** 2026-11-22
**Status:** Approved
**Size:** Small change
**Approved approach:** Globe icon with `ID` / `EN` code inside (option 1)

## Intent

The owner finds the visible labels `Bahasa Indonesia` and `English` too long in the header and wants them replaced with a compact SVG icon. The switcher must keep the same honest URL-based behavior and accessibility, only the visible treatment changes.

## Goals

- Replace the visible text of both options with a small inline SVG globe containing `ID` or `EN`.
- Keep the option names available to assistive technology via `aria-label` sourced from `siteSettings.languages`.
- Keep active (`aria-current="page"`) and unavailable (`aria-disabled="true"` + `sr-only` explanation) states unchanged.
- Let the owner see the rendered result on fork `main` before opening a PR.

## Non-goals

- No JS, no cookies/localStorage, no auto-redirect, no browser-language detection.
- No change to `src/lib/locale-switch.ts`, `src/data/locale-switch.ts`, or the counterpart rules.
- No new dependency or external icon font/library; inline SVG only.
- No change to English fallback stubs or content collections.

## Constraints

- `site.ts` remains the SSOT: labels and UI strings stay there, not hardcoded in the component.
- Accessible name must remain `Bahasa Indonesia` / `English` even though those words are no longer visible.
- SVG is decorative inside an already-labelled control: `aria-hidden="true"` and `focusable="false"`.
- Keep ≥44px target height and the existing `border-b-2` active/disabled treatment.
- Base work on `upstream/main` (`5188edb` or newer), not the divergent local `main`.
- Repo workflow: fork `main` may be used for preview, but the PR head is a dedicated branch created from that commit.

## Approaches considered

1. **Globe + `ID`/`EN` code (chosen).** Compact, neutral, one reusable SVG shape per option. Trade-off: still contains two letters, but far shorter than the full labels.
2. **Indonesian + UK/US flags.** Instantly recognizable but conflates language with country; UK vs US choice is debatable; needs two SVGs.
3. **Single globe toggling to the other language.** Smallest, but collapses two explicit options into a toggle and hides the active state when no counterpart exists. Rejected.

## Design

- `src/components/LanguageSwitcher.astro`:
  - Replace `{option.label}` inside the anchor/span with an inline `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">` drawing a globe and a `<text>` element containing the option code (`id` → `ID`, `en` → `EN`).
  - Add `aria-label={option.label}` to the anchor. For the disabled span, keep the full name in the `sr-only` text as `{option.label} — {unavailableText}` so the unavailability explanation is never overridden.
  - Keep `aria-current={option.active ? "page" : undefined}`, `aria-disabled="true"`, the `sr-only` unavailable text, and the existing class list/focus ring.
  - Derive the displayed code from `option.lang` (uppercased) so no new site-wide copy is introduced in the component.
- No files outside the component and this design doc change.

## Delivery workflow

1. Fetch upstream; fast-forward fork `main` to `upstream/main` if it is an ancestor.
2. Commit this design + the component change to fork `main`, push, and run validation so the owner can inspect the built result there.
3. Create `feat/icon-language-switcher` from that fork `main` commit, push it, and open the PR to `tnvcertification/tnvcertification` base `main` from that branch.
4. Leave fork `main` at the preview commit until the PR is merged, then re-sync it with upstream.

## Verification

- `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit:seo`, `pnpm audit:blocks`, `pnpm audit:page-images`.
- Inspect `dist` HTML: each switcher option has `aria-label` from `site.ts`; exactly one `aria-current="page"`; unavailable option still has `aria-disabled="true"` and `sr-only` text; no visible full label text remains in the switcher; no switcher href points to a fallback stub.
