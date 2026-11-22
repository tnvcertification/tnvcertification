/**
 * Gathers the published Indonesian routes that need an English fallback stub.
 * Route-shaping rules live in the pure lib/locale-fallback module.
 */
import { getCollection } from "astro:content";
import { buildEnglishFallbackPaths } from "../lib/locale-fallback";
import { getPublishedArticles } from "./articles";
import { routeOwnedPageSlugs } from "./pages";
import { getPublishedServices } from "./services";

export async function getEnglishFallbackPaths(): Promise<string[]> {
  const [pages, trainings, services, englishServices] = await Promise.all([
    getCollection("pages", ({ data }) => data.draft !== true),
    getCollection("training", ({ data }) => data.draft !== true),
    getPublishedServices("id"),
    getPublishedServices("en"),
  ]);
  const articles = getPublishedArticles();

  return buildEnglishFallbackPaths({
    pages: pages
      .filter((entry) => !routeOwnedPageSlugs.includes(entry.data.slug))
      .map((entry) => entry.data),
    services: services.map((entry) => entry.data),
    articles,
    trainings: trainings.map((entry) => entry.data),
    articlePageCount: Math.ceil(articles.length / 9),
    existingEnglishPaths: [
      "/en/services/",
      ...englishServices.map((entry) => `/en/services/${entry.data.slug}/`),
    ],
  });
}
