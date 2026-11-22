# Bilingual Content Standards

## Languages
- Indonesian: `id`
- English: `en`
Both languages are supported consistently across page content, frontmatter, blocks, UI, navigation, metadata, and user-facing messages.

## Content
- Author content in Markdown with frontmatter.
- Link translated pages using consistent translation IDs and maintain localized slugs.
- Do not mix languages on a localized page except for proper names, standards, or deliberately language-neutral content.
- Translations should preserve meaning and structural parity, but may use idiomatic wording.
- Validate title, description, slug, language, and translation key with collection schemas.

## Page entries (development mode)

Page entries are ID-only in this phase. There are no translated `pages` entries yet; `/en/...` pages are redirect stubs to the Indonesian route. Do not add `lang: "en"` page entries or duplicate page copy in route files while this combined pattern is being evaluated.

## UI and blocks
- Localize every user-facing string; pass labels/copy through props or a translation dictionary.
- Block identifiers may be language-neutral; all visible text, labels, alt text, and metadata must be localized.
- Use intentional fallback behavior when a translated route does not exist; never link to a broken route.

## SEO
- Set document `lang` correctly.
- Add reciprocal hreflang alternates for available translations, including self-reference.
- Use localized titles/descriptions and correct canonical URLs.
