/**
 * Page-block links are either absolute http(s) URLs or root-relative paths.
 * Keeping this rule in one place lets content schemas reject malformed values
 * such as `htp://x` or protocol-relative URLs without blocking internal links.
 */
export function isSupportedLinkUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || value !== url || /\s/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
