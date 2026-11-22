/**
 * Content editorial validation (build-time gate).
 *
 * Enforces the mandatory editorial rules from docs/project-capabilities-roadmap.md
 * (CONTENT-001 .. CONTENT-011) that the collection Zod schema cannot express.
 *
 * The markdown body is parsed into an mdast AST with remark. Headings come from
 * AST nodes and the intro is the paragraph block immediately after the first
 * H1. No line-based regex is used for document structure.
 *
 * NOTE: this module is Astro-import-free so it stays plainly testable. The Astro
 * integration (src/content-validation.ts) loads entries and throws the final
 * error to fail the build.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

export interface Diagnostic {
  entry: string;
  path: string;
  field: string;
  rule: string;
  reason: string;
  headingText?: string;
  expectedLevel?: number;
}

export interface Heading {
  level: number;
  text: string;
}

export interface ParsedContent {
  headings: Heading[];
  intro: string | null;
  introParagraphs: string[];
}

export interface ContentEntryLike {
  id: string;
  collection: string;
  path?: string;
  data: Record<string, unknown>;
  body: string;
}

const markdownParser = unified().use(remarkParse);

/** Parse headings and the intro paragraph block from a markdown body. */
export function parseContent(body: string): ParsedContent {
  const tree = markdownParser.parse(body) as Root;
  const headings: Heading[] = [];

  visit(tree, "heading", (node) => {
    headings.push({ level: node.depth, text: toString(node) });
  });

  const introParagraphs: string[] = [];
  const h1Index = tree.children.findIndex(
    (node) => node.type === "heading" && node.depth === 1,
  );
  if (h1Index >= 0) {
    for (let i = h1Index + 1; i < tree.children.length; i += 1) {
      const node = tree.children[i];
      if (node?.type !== "paragraph") break;
      introParagraphs.push(toString(node));
    }
  }

  return {
    headings,
    intro: introParagraphs[0] ?? null,
    introParagraphs,
  };
}

/**
 * Derive the document structure from frontmatter blocks when an entry has no
 * Markdown body. Levels mirror the rendered block components: hero → H1,
 * section-like blocks → H2, their items/steps → H3.
 */
export function parseFrontmatterContent(data: Record<string, unknown>): ParsedContent {
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  const lang = toStr(data.lang, "id").toLowerCase().split("-")[0];
  const faqHeading = lang === "en" ? "FAQ" : "Pertanyaan umum";
  const ctaHeading = lang === "en" ? "Call to action" : "Ajukan Sertifikasi";
  const headings: Heading[] = [];
  const introParagraphs: string[] = [];

  for (const raw of blocks) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const block = raw as Record<string, unknown>;
    const type = toStr(block.type);
    const headingText = toStr(block.title) || toStr(block.eyebrow);

    if (type === "hero") {
      headings.push({ level: 1, text: toStr(block.title) || toStr(data.title) });
      const description = toStr(block.description);
      if (description) introParagraphs.push(description);
      continue;
    }

    let sectionHeading: string | null = null;
    let children: unknown[] = [];
    if (type === "content-section") {
      sectionHeading = headingText || type;
      children = Array.isArray(block.items) ? block.items : [];
    } else if (type === "faq") {
      sectionHeading = headingText || faqHeading;
    } else if (type === "howto") {
      sectionHeading = headingText || type;
      children = Array.isArray(block.steps) ? block.steps : [];
    } else if (type === "cta") {
      sectionHeading = headingText || ctaHeading;
    } else if (type === "link-grid") {
      sectionHeading = headingText || null;
      children = Array.isArray(block.items) ? block.items : [];
    } else if (type === "listing" || type === "contact") {
      sectionHeading = headingText || null;
    }

    if (sectionHeading) headings.push({ level: 2, text: sectionHeading });
    for (const rawChild of children) {
      if (typeof rawChild !== "object" || rawChild === null || Array.isArray(rawChild)) continue;
      const child = rawChild as Record<string, unknown>;
      headings.push({ level: 3, text: toStr(child.title) || toStr(child.question) || type });
    }
  }

  return { headings, intro: introParagraphs[0] ?? null, introParagraphs };
}

function toStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function collectTextValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectTextValues);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectTextValues);
  }
  return [];
}

export function validateEntry(entry: ContentEntryLike): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const data = entry.data ?? {};
  const title = toStr(data.title);
  const introField = toStr(data.intro);
  const metaDescription = toStr(data.metaDescription);

  const add = (
    field: string,
    rule: string,
    reason: string,
    extra?: Pick<Diagnostic, "headingText" | "expectedLevel">,
  ): void => {
    diagnostics.push({
      entry: entry.id,
      path: entry.path ?? entry.id,
      field,
      rule,
      reason,
      ...extra,
    });
  };

  // Non-editorial records (for example training schedules) have no page body.
  if (!title) return diagnostics;

  // CONTENT-013: consultation/consulting language is prohibited across all site content.
  const allContentText = [...collectTextValues(data), entry.body ?? ""].join(" ");
  if (/(?:konsult\p{L}*|consult\p{L}*)/iu.test(allContentText)) {
    add(
      "content",
      "CONTENT-013",
      "Consultation/consulting terminology is prohibited. Use certification, audit, assessment, or certification-information wording as appropriate.",
    );
  }

  const hasBody = (entry.body ?? "").trim().length > 0;
  const structureField = hasBody ? "body" : "blocks";
  const { headings, intro, introParagraphs } = hasBody
    ? parseContent(entry.body ?? "")
    : parseFrontmatterContent(data);
  const effectiveIntro = introField || intro;

  // CONTENT-001: an H1 must exist, from the body or from the hero block.
  if (!headings.some((h) => h.level === 1)) {
    add(structureField, "CONTENT-001", "Missing H1. The page must start with an H1 heading.");
  }

  // CONTENT-002: an intro field is always required. Body-based entries additionally
  // need exactly one intro paragraph immediately after H1 that matches the field.
  if (!introField) {
    add("intro", "CONTENT-002", "The `intro` field is required.");
  }
  if (hasBody) {
    if (!intro) {
      add("intro", "CONTENT-002", "No introductory paragraph immediately after H1.");
    } else if (introParagraphs.length !== 1) {
      add(
        "intro",
        "CONTENT-002",
        `Expected exactly one intro paragraph after H1; found ${introParagraphs.length}.`,
      );
    }
    if (introField && intro && introField.trim() !== intro.trim()) {
      add("intro", "CONTENT-002", "The `intro` field must match the first paragraph after H1.");
    }
  }

  // CONTENT-003: the intro begins with the title and a language-appropriate copula.
  const lang = toStr(data.lang, "id").toLowerCase().split("-")[0];
  const introCopula = lang === "en" ? "is" : "adalah";
  const startsWithExpectedIntro = (value: string): boolean =>
    value.trimStart().toLocaleLowerCase(lang === "en" ? "en" : "id").startsWith(
      `${title} ${introCopula}`.toLocaleLowerCase(lang === "en" ? "en" : "id"),
    );
  if (title && effectiveIntro && !startsWithExpectedIntro(effectiveIntro)) {
    add(
      "intro",
      "CONTENT-003",
      `Intro must begin with the title followed by "${introCopula}" (expected "${title} ${introCopula} ...").`,
    );
  }

  // CONTENT-012: published entries require an approved publication date.
  if (data.draft !== true && data.pubDate === undefined) {
    add("pubDate", "CONTENT-012", "Published entries require an approved pubDate; drafts may omit it.");
  }

  // CONTENT-005: metaDescription is required and non-empty.
  if (!metaDescription) {
    add("metaDescription", "CONTENT-005", "metaDescription is required and must be non-empty.");
  }

  // CONTENT-006 (within entry): metaDescription must not duplicate the intro.
  if (metaDescription && effectiveIntro && metaDescription.trim() === effectiveIntro.trim()) {
    add("metaDescription", "CONTENT-006", "metaDescription must not duplicate the intro text.");
  }

  // CONTENT-007 / 008 / 009 / 006: featured image.
  const image = data.featuredImage as
    | { src?: unknown; alt?: unknown }
    | undefined;
  if (!image || typeof image !== "object" || Array.isArray(image)) {
    if (data.draft !== true) {
      add("featuredImage", "CONTENT-007", "Published entries require a single featuredImage object; drafts may omit it until an asset is approved.");
    }
  } else {
    const src = toStr(image.src);
    const alt = toStr(image.alt);
    if (!src) {
      add("featuredImage", "CONTENT-007", "featuredImage.src is required.");
    }
    if (!alt) {
      add("featuredImage.alt", "CONTENT-008", "featuredImage.alt is required.");
    } else {
      const altCopula = lang === "en" ? "is" : "adalah";
      const normalizedAlt = alt.trim().toLocaleLowerCase(lang === "en" ? "en" : "id");
      const normalizedTitle = title.trim().toLocaleLowerCase(lang === "en" ? "en" : "id");
      if (!normalizedAlt.includes(` ${altCopula} `)) {
        add("featuredImage.alt", "CONTENT-008", `featuredImage.alt must include the language-appropriate phrase "${altCopula}" (got "${alt}").`);
      } else if (!normalizedAlt.includes(normalizedTitle)) {
        add("featuredImage.alt", "CONTENT-008", "featuredImage.alt must be title-relevant.");
      }
      if (effectiveIntro && alt.trim() === effectiveIntro.trim()) {
        add("featuredImage.alt", "CONTENT-006", "featuredImage.alt must not duplicate the intro.");
      }
      if (title && alt.trim() === title.trim()) {
        add("featuredImage.alt", "CONTENT-006", "featuredImage.alt must not duplicate the title.");
      }
      if (effectiveIntro && alt.length >= effectiveIntro.length) {
        add("featuredImage.alt", "CONTENT-009", "featuredImage.alt must be shorter than the intro.");
      }
    }
  }

  if (metaDescription && typeof image === "object" && image !== null && !Array.isArray(image)) {
    const imageAlt = toStr(image.alt).trim();
    if (imageAlt && metaDescription.trim() === imageAlt) {
      add("metaDescription", "CONTENT-006", "metaDescription must not duplicate featuredImage.alt.");
    }
  }

  // CONTENT-010: optional `images`, when supplied, is a valid array of objects.
  const imagesVal = data.images;
  if (imagesVal !== undefined) {
    if (!Array.isArray(imagesVal)) {
      add("images", "CONTENT-010", "Optional `images` must be an array when supplied.");
    } else {
      for (let i = 0; i < imagesVal.length; i += 1) {
        const img = imagesVal[i];
        if (typeof img !== "object" || img === null || Array.isArray(img)) {
          add(`images[${i}]`, "CONTENT-010", "Each item in `images` must be an image object.");
          continue;
        }
        const galleryImage = img as { src?: unknown; alt?: unknown };
        if (!toStr(galleryImage.src).trim()) {
          add(`images[${i}].src`, "CONTENT-010", "Each image requires a non-empty src.");
        }
        if (!toStr(galleryImage.alt).trim()) {
          add(`images[${i}].alt`, "CONTENT-010", "Each image requires a non-empty alt.");
        }
      }
    }
  }

  // CONTENT-011: heading levels must not skip downward levels.
  for (let i = 1; i < headings.length; i += 1) {
    const prev = headings[i - 1];
    const next = headings[i];
    if (!prev || !next) continue;
    if (next.level > prev.level && next.level - prev.level > 1) {
      add(
        structureField,
        "CONTENT-011",
        `Heading level skipped: H${prev.level} cannot be followed directly by H${next.level}.`,
        { headingText: next.text, expectedLevel: prev.level + 1 },
      );
    }
  }

  return diagnostics;
}

/** CONTENT-014: editorial entries must be frontmatter-only (no Markdown body). */
export function validateFrontmatterOnlyEntries(entries: ContentEntryLike[]): Diagnostic[] {
  return entries.flatMap((entry) => {
    if (!toStr(entry.data?.title) || !(entry.body ?? "").trim()) return [];
    return [{
      entry: entry.id,
      path: entry.path ?? entry.id,
      field: "body",
      rule: "CONTENT-014",
      reason: "Editorial entries must contain frontmatter only; remove the Markdown body.",
    }];
  });
}

export function validateAllEntries(entries: ContentEntryLike[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const introOwners = new Map<string, string>();
  const metaOwners = new Map<string, string>();
  const slugOwners = new Map<string, string>();

  for (const entry of entries) {
    diagnostics.push(...validateEntry(entry));

    const data = entry.data ?? {};
    const intro = (toStr(data.intro) || parseContent(entry.body ?? "").intro || "").trim();
    if (intro) {
      const owner = introOwners.get(intro);
      if (owner) {
        diagnostics.push({
          entry: entry.id,
          path: entry.path ?? entry.id,
          field: "intro",
          rule: "CONTENT-004",
          reason: `Intro text is reused from "${owner}".`,
        });
      } else {
        introOwners.set(intro, entry.id);
      }
    }

    const slug = toStr(data.slug).trim();
    if (slug) {
      const slugKey = `${entry.collection}:${toStr(data.lang)}:${slug.toLowerCase()}`;
      const slugOwner = slugOwners.get(slugKey);
      if (slugOwner) {
        diagnostics.push({
          entry: entry.id,
          path: entry.path ?? entry.id,
          field: "slug",
          rule: "CONTENT-006",
          reason: `Slug is duplicated on "${slugOwner}" for the same collection and language.`,
        });
      } else {
        slugOwners.set(slugKey, entry.id);
      }
    }

    const meta = toStr(data.metaDescription).trim();
    if (meta) {
      const owner = metaOwners.get(meta);
      if (owner) {
        diagnostics.push({
          entry: entry.id,
          path: entry.path ?? entry.id,
          field: "metaDescription",
          rule: "CONTENT-006",
          reason: `metaDescription is duplicated on "${owner}".`,
        });
      } else {
        metaOwners.set(meta, entry.id);
      }
    }
  }

  return diagnostics;
}
