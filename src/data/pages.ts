/**
 * Shared page-entry lookups for the development-mode combined page pattern.
 * Editorial copy lives in `src/content/pages/`; routes only resolve and render it.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type PageEntry = CollectionEntry<"pages">;
type PageBlockUnion = NonNullable<PageEntry["data"]["blocks"]>[number];

export type PageBlock = PageBlockUnion;
export type HeroBlock = Extract<PageBlockUnion, { type: "hero" }>;
export type LinkGridBlock = Extract<PageBlockUnion, { type: "link-grid" }>;
export type ListingBlock = Extract<PageBlockUnion, { type: "listing" }>;
export type ContactBlock = Extract<PageBlockUnion, { type: "contact" }>;

/** Slugs owned by a dedicated route; the generic [slug].astro must skip them. */
export const routeOwnedPageSlugs: readonly string[] = [
  "home",
  "services",
  "csms",
  "trainings",
  "schedules",
  "articles",
];

export async function getPageEntry(slug: string): Promise<PageEntry> {
  const entries = await getCollection(
    "pages",
    (entry) => entry.data.slug === slug && entry.data.draft !== true,
  );
  const entry = entries[0];
  if (!entry) throw new Error(`Page entry "${slug}" not found or is a draft`);
  return entry;
}

export function getPageHero(entry: PageEntry): HeroBlock | undefined {
  return entry.data.blocks?.find((block): block is HeroBlock => block.type === "hero");
}

export function getPageBlocks(entry: PageEntry): PageBlock[] {
  return entry.data.blocks ?? [];
}
