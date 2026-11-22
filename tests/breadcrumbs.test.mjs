import assert from "node:assert/strict";
import test from "node:test";
import { siteCrumb } from "../src/data/breadcrumbs.ts";

test("siteCrumb resolves labels from primaryNavigation", () => {
  assert.deepEqual(siteCrumb("/services/"), { label: "Layanan", href: "/services/" });
  assert.deepEqual(siteCrumb("/"), { label: "Beranda", href: "/" });
});

test("siteCrumb rejects hrefs that are not in primaryNavigation", () => {
  assert.throws(() => siteCrumb("/not-a-site-route/"), /primaryNavigation/);
});
