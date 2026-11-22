#!/usr/bin/env node
/**
 * Fast editorial preflight for changed Markdown entries.
 * Cross-entry checks remain in the Astro build integration.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { validateEntry, validateFrontmatterOnlyEntries } from "../src/lib/content-validation.ts";
import { editorialCollections } from "../src/data/collections.ts";

const [base, head = "HEAD"] = process.argv.slice(2);

function changedEditorialFiles() {
  if (!base || /^0+$/.test(base)) {
    throw new Error("A valid base commit is required for selective validation.");
  }
  const raw = execFileSync("git", ["diff", "--name-status", "-z", base, head], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const fields = raw.toString("utf8").split("\0");
  const files = [];
  let index = 0;

  while (index < fields.length - 1) {
    const status = fields[index++];
    if (!status) continue;
    if (status !== "A" && status !== "M") {
      throw new Error('Unsafe diff status "' + status + '"; use the full validation path.');
    }
    const path = fields[index++];
    if (!path) continue;
    const collection = editorialCollections.find((item) =>
      path.startsWith(item.dir + "/"),
    );
    if (!collection || !/\.(md|mdx)$/i.test(path)) {
      throw new Error("Changed path is not an editorial Markdown entry: " + path);
    }
    files.push({ path, collection: collection.name });
  }

  if (files.length === 0) {
    throw new Error("No changed editorial Markdown files were found.");
  }
  return files;
}

function parseEntry(path, collection) {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(path + ": missing or malformed YAML frontmatter delimiters.");
  }

  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    throw new Error(
      path + ": invalid YAML frontmatter: " +
      (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(path + ": YAML frontmatter must be an object.");
  }

  const body = raw.slice(match[0].length);
  return { id: path, path, collection, data, body };
}

try {
  const files = changedEditorialFiles();
  const diagnostics = files.flatMap(({ path, collection }) => {
    const entry = parseEntry(path, collection);
    return [
      ...validateEntry(entry),
      ...validateFrontmatterOnlyEntries([entry]),
    ];
  });

  console.log("Selective editorial validation: " + files.length + " changed file(s).");
  if (diagnostics.length > 0) {
    console.error(
      diagnostics
        .map((item) => "[" + item.rule + "] " + item.path + " → " + item.field + ": " + item.reason)
        .join("\n"),
    );
    process.exitCode = 1;
  } else {
    console.log("Changed editorial entries passed individual validation.");
    console.log("Global duplicate, taxonomy, scheme, and relation checks remain enforced by the full Astro build.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
