/**
 * Pure resolver for the header language switcher. Collection access and
 * fallback-route discovery belong in the data layer; no Astro imports here.
 */
import { siteSettings } from "../site.ts";
import { serviceIndexPath, servicePath, type ServiceLang } from "./service-routing.ts";

export interface LanguageEntry {
  lang: string;
  slug: string;
  translationKey: string;
}

export interface LanguageSwitchInput {
  pathname: string;
  currentLang: string;
  services: readonly LanguageEntry[];
  articles: readonly LanguageEntry[];
  /** Indonesian paths whose /en/ variant is a redirect stub. */
  fallbackPaths: readonly string[];
}

export interface LanguageOption {
  lang: string;
  label: string;
  href: string;
  active: boolean;
  available: boolean;
}

const SERVICE_DETAIL_PATH = /^\/(?:en\/)?services\/[^/]+\/$/;
const ARTICLE_DETAIL_PATH = /^\/articles\/[^/]+\/$/;

function withTrailingSlash(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function articlePath(entry: LanguageEntry): string {
  return `/articles/${entry.slug}/`;
}

/** English service routes are /en + the Indonesian route; stub paths never carry /en. */
function isFallbackStub(candidate: string, fallbackPaths: readonly string[]): boolean {
  if (!candidate.startsWith("/en/")) return false;
  const indonesianPath = candidate.slice(3);
  return fallbackPaths.some((path) => withTrailingSlash(path) === indonesianPath);
}

function findCounterpart(
  entries: readonly LanguageEntry[],
  source: LanguageEntry,
  lang: string,
  toPath: (entry: LanguageEntry) => string,
): string {
  const target = entries.find(
    (entry) => entry.lang === lang && entry.translationKey === source.translationKey,
  );
  return target ? toPath(target) : "";
}

function counterpartHref(
  lang: ServiceLang,
  input: LanguageSwitchInput,
  pathname: string,
): string {
  const { currentLang, services, articles } = input;
  if (lang === currentLang) return "";

  if (SERVICE_DETAIL_PATH.test(pathname)) {
    const source = services.find(
      (entry) => entry.lang === currentLang && servicePath(entry) === pathname,
    );
    return source ? findCounterpart(services, source, lang, servicePath) : "";
  }

  if (ARTICLE_DETAIL_PATH.test(pathname)) {
    const source = articles.find(
      (entry) => entry.lang === currentLang && articlePath(entry) === pathname,
    );
    return source ? findCounterpart(articles, source, lang, articlePath) : "";
  }

  if (pathname === serviceIndexPath("id") || pathname === serviceIndexPath("en")) {
    return serviceIndexPath(lang);
  }

  return "";
}

export function resolveLanguageOptions(input: LanguageSwitchInput): LanguageOption[] {
  const pathname = withTrailingSlash(input.pathname);

  return siteSettings.languages.map(({ code, label }) => {
    if (code === input.currentLang) {
      return { lang: code, label, href: pathname, active: true, available: true };
    }

    const candidate = counterpartHref(code, input, pathname);
    const available = candidate !== "" && !isFallbackStub(candidate, input.fallbackPaths);
    return { lang: code, label, href: available ? candidate : "", active: false, available };
  });
}
