import { defineCollection } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { collectionRegistry } from "./data/collections";

/**
 * Shared image-object schema (single primary / optional gallery).
 * `src`: relative path / asset URL.
 * `alt`: alternative text; must explain the title with "adalah".
 * `caption`: optional caption.
 */
const imageObjectSchema = z.object({
  src: z.string().min(1, "image src is required"),
  alt: z.string().min(1, "image alt is required"),
  caption: z.string().optional(),
});

// --- Shared blocks (discriminated union) ---
// Explicit surface overrides the renderer's accessible alternating section palette.
const sectionSurfaceSchema = z.enum(["white", "blue", "navy", "mint", "coral", "cream"]);
const blockIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "block id must be lowercase kebab-case");
const faqBlock = z.object({
  type: z.literal("faq"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

const contentSectionBlock = z.object({
  type: z.literal("content-section"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  })).optional(),
});

const howToBlock = z.object({
  type: z.literal("howto"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  steps: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      image: imageObjectSchema.optional(),
    }),
  ).min(1, "howto requires at least one step"),
});

const ctaBlock = z.object({
  type: z.literal("cta"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  variant: z.enum(["primary", "secondary", "ghost"]).optional().default("primary"),
  title: z.string().optional(),
  description: z.string().optional(),
  link: z
    .object({
      label: z.string().min(1),
      url: z.string().url(),
    })
    .optional(),
});

// --- Page structure blocks (development-mode combined page pattern) ---
const heroBlock = z.object({
  type: z.literal("hero"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
});

const linkGridBlock = z.object({
  type: z.literal("link-grid"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(z.object({
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    href: z.string().min(1),
    actionLabel: z.string().optional(),
  })).min(1),
});

const listingBlock = z.object({
  type: z.literal("listing"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  source: z.enum(["services", "trainings", "schedules", "articles"]),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  emptyTitle: z.string().optional(),
  emptyDescription: z.string().optional(),
  emptyActionLabel: z.string().optional(),
  emptyActionHref: z.string().optional(),
});

const contactBlock = z.object({
  type: z.literal("contact"),
  id: blockIdSchema.optional(),
  surface: sectionSurfaceSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  labels: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

const blockSchema = z.discriminatedUnion("type", [contentSectionBlock, faqBlock, howToBlock, ctaBlock]);

const pageBlockSchema = z.discriminatedUnion("type", [
  heroBlock,
  linkGridBlock,
  listingBlock,
  contactBlock,
  contentSectionBlock,
  faqBlock,
  howToBlock,
  ctaBlock,
]);

/**
 * Fields shared by every publishable page-like entry. Schedule and category
 * records keep their own schemas because they are not editorial pages.
 */
const baseEntrySchema = z.object({
  title: z.string().min(1, "title is required"),
  intro: z.string().min(1, "intro is required"),
  slug: z.string().min(1),
  metaDescription: z.string().min(1, "meta description is required"),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  featuredImage: imageObjectSchema,
  images: z.array(imageObjectSchema).optional(),
  lang: z.enum(["id", "en"]),
  translationKey: z.string().min(1, "translationKey is required"),
});

// --- Articles ---
const articleSchema = baseEntrySchema.extend({
  // Drafts may omit unapproved publication metadata and imagery.
  pubDate: z.coerce.date().optional(),
  featuredImage: imageObjectSchema.optional(),
  draft: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  // Explicit optional association; never inferred from labels, categories or slugs.
  serviceId: z.number().int().positive().optional(),
});

// --- Services ---
const serviceSchema = baseEntrySchema.extend({
  id: z.number().int().positive(),
  draft: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  serviceType: z.string().optional(),
  category: z.string().optional(),
  blocks: z.array(blockSchema).optional(),
});

// --- Certifications ---
const certificationSchema = baseEntrySchema.extend({
  categoryIds: z.array(z.string()).optional(),
});

// --- Training (program/course page) ---
const trainingHeroSchema = z.object({
  headline: z.string().min(1, "hero headline is required"),
  eyebrow: z.string().optional(),
  description: z.string().optional(),
  alt: z.string().min(1, "hero image alt is required"),
  cta: z
    .object({
      label: z.string().min(1),
      url: z.string().url(),
    })
    .optional(),
});

const trainingSchema = baseEntrySchema.extend({
  draft: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  hero: trainingHeroSchema.optional(),
  blocks: z.array(blockSchema).optional(),
});

// --- Categories (taxonomy records, not editorial pages) ---
const categorySchema = z.object({
  title: z.string().min(1, "title is required"),
  slug: z.string().min(1),
  description: z.string().optional(),
  lang: z.enum(["id", "en"]),
  translationKey: z.string().min(1, "translationKey is required"),
  // Candidate categories remain non-public until their scope is approved.
  status: z.enum(["planned", "active"]).default("planned"),
});

// --- Training schedules (event records; training link is required) ---
const trainingScheduleSchema = z.object({
  trainingSlug: z.string().min(1, "trainingSlug is required"),
  serviceSlug: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
  timezone: z.string().optional(),
  locationType: z.enum(["offline", "online", "hybrid"]).optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  registrationStatus: z
    .enum(["open", "closed", "full", "cancelled"])
    .optional(),
  price: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  quota: z.number().int().positive().optional(),
  registrationUrl: z.string().url().optional(),
  notes: z.string().optional(),
  slug: z.string().min(1),
});

// --- General pages ---
const pageSchema = baseEntrySchema.extend({
  draft: z.boolean().optional(),
  blocks: z.array(pageBlockSchema).optional(),
});

function collection<T extends z.ZodTypeAny>(name: keyof typeof collectionRegistry, schema: T) {
  return defineCollection({
    loader: glob({
      base: `./${collectionRegistry[name].dir}`,
      pattern: "**/*.{md,mdx}",
    }),
    schema,
  });
}

export const collections = {
  articles: collection("articles", articleSchema),
  services: collection("services", serviceSchema),
  categories: collection("categories", categorySchema),
  certifications: collection("certifications", certificationSchema),
  training: collection("training", trainingSchema),
  trainingSchedules: collection("trainingSchedules", trainingScheduleSchema),
  pages: collection("pages", pageSchema),
};
