import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "content");

const routePrefixes = new Map([
  ["articles", "/articles/"],
  ["services", "/services/"],
  ["pages", "/"],
]);

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
}

function quotedField(fm, name) {
  return fm.match(new RegExp(`^${name}:\\s*"([^"]+)"`, "m"))?.[1];
}

function listMarkdown(directory) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdown(full);
    return entry.isFile() && entry.name.endsWith(".md") ? [full] : [];
  });
}

const lastmodByUrl = new Map();

for (const [directory, prefix] of routePrefixes) {
  for (const file of listMarkdown(path.join(contentRoot, directory))) {
    const fm = frontmatter(readFileSync(file, "utf8"));
    if (/^draft:\s*true\s*$/m.test(fm)) continue;

    const slug = quotedField(fm, "slug");
    const date = quotedField(fm, "updatedDate") ?? quotedField(fm, "pubDate");
    if (!slug || !date) continue;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) continue;

    // `home` is a page entry but its canonical URL is the site root, not /home/.
    const urlPath = directory === "pages" && slug === "home" ? "/" : `${prefix}${slug}/`;

    // Keep UTC precision to the second, matching the authored metadata.
    lastmodByUrl.set(urlPath, parsed.toISOString().replace(/\.\d{3}Z$/, "Z"));
  }
}

export function getContentLastmod(url) {
  return lastmodByUrl.get(url);
}

export function normalizeSitemapLastmod(directory) {
  let files;
  try {
    files = readdirSync(directory);
  } catch {
    return;
  }

  for (const name of files.filter((item) => /^sitemap.*\.xml$/.test(item))) {
    const file = path.join(directory, name);
    const xml = readFileSync(file, "utf8");
    const normalized = xml.replace(
      /(<lastmod>[^<]*?)\.\d{3}Z(<\/lastmod>)/g,
      "$1Z$2",
    );
    if (normalized !== xml) writeFileSync(file, normalized);
  }
}
