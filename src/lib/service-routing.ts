/**
 * Shared routing rules for language-separated service pages.
 * English public content lives under /en/*; Indonesian content stays at the root.
 */
export type ServiceLang = "id" | "en";

const INDEX_PATHS: Record<ServiceLang, string> = {
  id: "/services/",
  en: "/en/services/",
};

export function serviceIndexPath(lang: ServiceLang): string {
  return INDEX_PATHS[lang];
}

export function servicePath(service: { lang: string; slug: string }): string {
  const lang: ServiceLang = service.lang === "en" ? "en" : "id";
  return `${serviceIndexPath(lang)}${service.slug}/`;
}

export function isPublishedServiceForLang(
  data: { draft?: boolean; lang?: string },
  lang: ServiceLang,
): boolean {
  return data.draft !== true && data.lang === lang;
}
