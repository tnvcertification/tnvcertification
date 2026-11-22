#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePageImageRecords } from "../src/lib/page-image-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const mainMenuRoutes = new Set([
  "/",
  "/services/",
  "/csms/",
  "/trainings/",
  "/schedules/",
  "/articles/",
]);

/** Editorial detail routes must carry a hero block with H1, intro and image. */
export function isHeroRequiredRoute(route) {
  return mainMenuRoutes.has(route) || /^\/(?:en\/)?(?:services|articles)\/[^/]+\/$/.test(route);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
  });
}

function attr(tag, name) {
  const match = tag.match(new RegExp(name + "=[\"']([^\"']*)[\"']", "i"));
  return match ? match[1] : "";
}

function runAudit() {
  const dist = path.resolve(process.argv[2] ?? path.join(root, "dist"));
  if (!existsSync(dist)) {
    console.error("Build output not found. Run pnpm build first.");
    process.exit(1);
  }

  const records = [];
  const errors = [];
  for (const file of walk(dist)) {
    const html = readFileSync(file, "utf8");
    // Legacy route redirects are transport documents, not independently addressable content URLs.
    if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) continue;
    const canonicalTag = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)?.[0];
    const canonical = canonicalTag ? attr(canonicalTag, "href") : "";
    const route = canonical
      ? new URL(canonical, "https://tnvcertification.invalid").pathname
      : path.relative(dist, file);
    const images = [...html.matchAll(/<img\b[^>]*>/gi)]
      .map((match) => match[0])
      .filter((tag) => /(?:^|\s)data-page-image(?:\s|=|>)/i.test(tag));

    if (!canonical && path.basename(file) !== "404.html") errors.push("[PAGE-IMAGE-001] " + file + ": missing canonical URL.");
    if (!canonical && path.basename(file) === "404.html") continue;
    if (images.length !== 1) {
      errors.push("[PAGE-IMAGE-002] " + route + ": expected exactly one data-page-image; found " + images.length + ".");
      continue;
    }

    if (isHeroRequiredRoute(route)) {
      const hero = html.match(/<section\b(?=[^>]*data-main-menu-hero)[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? "";
      if (!hero || !/<h1\b/i.test(hero) || !/<p\b/i.test(hero) || !/<img\b[^>]*data-page-image/i.test(hero)) {
        errors.push("[PAGE-HERO-001] " + route + ": page must have one hero containing an H1, introductory paragraph, and featured image.");
      }
    }

    const src = attr(images[0], "src");
    if (!src.startsWith("/")) {
      errors.push("[PAGE-IMAGE-002] " + route + ": primary image must use a root-relative local src.");
      continue;
    }

    const asset = path.resolve(
      dist,
      "." + decodeURIComponent(new URL(src, "https://tnvcertification.invalid").pathname),
    );
    if (!asset.startsWith(dist + path.sep) || !existsSync(asset)) {
      errors.push("[PAGE-IMAGE-005] " + route + ": primary image asset is missing from build output: " + src + ".");
      continue;
    }
    const hash = createHash("sha256").update(readFileSync(asset)).digest("hex");
    records.push({ route, src, hash });
  }

  errors.push(
    ...validatePageImageRecords(records).map(
      (diagnostic) => "[" + diagnostic.rule + "] " + diagnostic.route + ": " + diagnostic.reason,
    ),
  );

  if (errors.length > 0) {
    console.error("Page image uniqueness audit failed:\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log(
    "Page image uniqueness audit passed: " + records.length + " generated URL(s), one unique primary image per URL.",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit();
}
