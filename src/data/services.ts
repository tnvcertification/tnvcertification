/**
 * Shared service query. Language separation and URL rules live in service-routing.ts.
 */
import { getCollection } from "astro:content";
import { isPublishedServiceForLang, type ServiceLang } from "../lib/service-routing";

export type { ServiceLang } from "../lib/service-routing";
export { serviceIndexPath, servicePath } from "../lib/service-routing";

export async function getPublishedServices(lang: ServiceLang) {
  return getCollection("services", ({ data }) => isPublishedServiceForLang(data, lang));
}
