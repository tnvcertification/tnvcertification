/**
 * Gathers published entries and fallback routes for the header language
 * switcher. All link decisions stay in the pure lib/locale-switch resolver.
 */
import { getPublishedArticles } from "./articles";
import { getEnglishFallbackPaths } from "./locale-fallback";
import { getPublishedServices } from "./services";
import {
  resolveLanguageOptions,
  type LanguageOption,
} from "../lib/locale-switch";

export async function getLanguageOptions(
  pathname: string,
  currentLang: string,
): Promise<LanguageOption[]> {
  const [idServices, enServices, fallbackPaths] = await Promise.all([
    getPublishedServices("id"),
    getPublishedServices("en"),
    getEnglishFallbackPaths(),
  ]);
  return resolveLanguageOptions({
    pathname,
    currentLang,
    services: [...idServices, ...enServices].map((entry) => ({
      lang: entry.data.lang,
      slug: entry.data.slug,
      translationKey: entry.data.translationKey,
    })),
    articles: getPublishedArticles().map((article) => ({
      lang: article.lang,
      slug: article.slug,
      translationKey: article.translationKey,
    })),
    fallbackPaths,
  });
}
