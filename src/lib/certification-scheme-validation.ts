import type { CertificationScheme } from "../data/certification-schemes";

export interface SchemeDiagnostic {
  schemeId: string;
  field: string;
  rule: string;
  reason: string;
}

/** Validate stable identifiers, canonical categories and publication readiness. */
export function validateCertificationSchemes(
  schemes: readonly CertificationScheme[],
  categorySlugs: readonly string[],
): SchemeDiagnostic[] {
  const diagnostics: SchemeDiagnostic[] = [];
  const ids = new Set<string>();
  const designations = new Set<string>();
  const knownCategories = new Set(categorySlugs);

  for (const scheme of schemes) {
    if (ids.has(scheme.id)) {
      diagnostics.push({ schemeId: scheme.id, field: "id", rule: "SCHEME-001", reason: `Scheme id "${scheme.id}" is duplicated.` });
    }
    ids.add(scheme.id);

    const designation = scheme.designation.trim().toLowerCase();
    if (designations.has(designation)) {
      diagnostics.push({ schemeId: scheme.id, field: "designation", rule: "SCHEME-002", reason: `Scheme designation "${scheme.designation}" is duplicated.` });
    }
    designations.add(designation);

    if (!knownCategories.has(scheme.categorySlug)) {
      diagnostics.push({ schemeId: scheme.id, field: "categorySlug", rule: "SCHEME-003", reason: `Category slug "${scheme.categorySlug}" does not exist.` });
    }

    if (scheme.status === "active" && !scheme.edition?.trim()) {
      diagnostics.push({ schemeId: scheme.id, field: "edition", rule: "SCHEME-004", reason: "An active scheme must have a verified edition." });
    }
  }

  return diagnostics;
}
