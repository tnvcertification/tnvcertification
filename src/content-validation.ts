/**
 * Build-time content editorial and taxonomy validation integration.
 *
 * Editorial entries are checked against CONTENT-001..011. Category records
 * are loaded separately because categories are taxonomy records, not
 * publishable editorial pages. Cross-collection taxonomy checks validate
 * bilingual category pairs and explicit categoryIds references.
 */
import { globSync } from "tinyglobby";
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { validateAllEntries, validateFrontmatterOnlyEntries, type ContentEntryLike } from "./lib/content-validation";
import { validateTaxonomy, type TaxonomyRecordLike } from "./lib/taxonomy-validation";
import { certificationSchemes } from "./data/certification-schemes";
import { validateCertificationSchemes } from "./lib/certification-scheme-validation";
import { validateArticleServiceRelations } from "./lib/article-service-relations";
import { validateBlockIds } from "./lib/block-ids";
import { collectionRegistry, editorialCollections } from "./data/collections";

function readFrontmatter(filePath: string): FrontmatterPayload | null {
  const raw = readFileSync(filePath, "utf8");
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) return null;

  const parts = trimmed.slice(3).split(/\r?\n---/);
  const frontmatterPart = parts[0];
  if (frontmatterPart === undefined) return null;

  let data: unknown;
  try {
    data = parseYaml(frontmatterPart);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  const body = parts.length > 1 ? parts.slice(1).join("\n").trimStart() : "";
  return { data: data as Record<string, unknown>, body };
}

interface FrontmatterPayload {
  data: Record<string, unknown>;
  body: string;
}

function loadContentEntries(): ContentEntryLike[] {
  const entries: ContentEntryLike[] = [];
  for (const col of editorialCollections) {
    const files = globSync(`${col.dir}/**/*.{md,mdx}`, { onlyFiles: true });
    for (const file of files) {
      const payload = readFrontmatter(file);
      if (payload === null) continue;
      entries.push({
        id: file,
        collection: col.name,
        path: file,
        data: payload.data,
        body: payload.body,
      });
    }
  }
  return entries;
}

function loadCategoryEntries(): TaxonomyRecordLike[] {
  const files = globSync(`${collectionRegistry.categories.dir}/**/*.{md,mdx}`, { onlyFiles: true });
  return files.flatMap((file) => {
    const payload = readFrontmatter(file);
    return payload
      ? [{ id: file, path: file, data: payload.data }]
      : [];
  });
}

function findRestrictedLanguageFiles(): string[] {
  const files = globSync(
    ["src/content/**/*.{md,mdx}", "src/pages/**/*.astro", "src/components/**/*.astro", "src/layouts/**/*.astro", "src/site.ts"],
    { onlyFiles: true },
  );
  const restrictedTerms = /(?:konsult\p{L}*|consult\p{L}*)/iu;
  return files.filter((file) => restrictedTerms.test(readFileSync(file, "utf8")));
}

export const contentValidationIntegration = {
  name: "validate-content",
  hooks: {
    "astro:build:done": async () => {
      const restrictedLanguageFiles = findRestrictedLanguageFiles();
      if (restrictedLanguageFiles.length > 0) {
        throw new Error([
          "Content policy violation: consultation/consulting terminology is prohibited in public-facing content and components.",
          ...restrictedLanguageFiles.map((file) => `  [CONTENT-013] ${file}`),
        ].join("\\n"));
      }

      const contentEntries = loadContentEntries();
      const categories = loadCategoryEntries();
      const diagnostics = [
        ...validateAllEntries(contentEntries),
        ...validateFrontmatterOnlyEntries(contentEntries),
        ...validateTaxonomy(categories, contentEntries),
        ...validateBlockIds(contentEntries.map((entry) => ({ path: entry.path ?? entry.id, data: entry.data }))),
      ];
      const relationDiagnostics = validateArticleServiceRelations(contentEntries);
      const schemeDiagnostics = validateCertificationSchemes(
        certificationSchemes,
        categories.map((category) => String(category.data.slug ?? "")),
      );
      if (diagnostics.length > 0 || schemeDiagnostics.length > 0 || relationDiagnostics.length > 0) {
        const totalIssues = diagnostics.length + schemeDiagnostics.length + relationDiagnostics.length;
        const lines = [
          `Content validation failed with ${totalIssues} issue(s):`,
          ...diagnostics.map((d) => `  [${d.rule}] ${d.path} → ${d.field}: ${d.reason}`),
          ...schemeDiagnostics.map((d) => `  [${d.rule}] scheme:${d.schemeId} → ${d.field}: ${d.reason}`),
          ...relationDiagnostics.map((d) => `  [${d.rule}] ${d.path} → ${d.field}: ${d.reason}`),
          "",
          "Fix the content, taxonomy, certification-scheme and article-service references before building again.",
        ];
        throw new Error(lines.join("\n"));
      }
    },
  },
};
