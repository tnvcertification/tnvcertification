import { primaryNavigation } from "../site";

export interface SiteCrumb {
  label: string;
  href: string;
}

/** Resolve a breadcrumb label from the central navigation in site.ts. */
export function siteCrumb(href: string): SiteCrumb {
  const item = primaryNavigation.find((entry) => entry.href === href);
  if (!item) {
    throw new Error(`No primaryNavigation entry found for "${href}".`);
  }
  return { label: item.label, href: item.href };
}
