const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { deriveManifests, importedScripts } = require("../scripts/build.js");

const root = path.join(__dirname, "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const bgSource = fs.readFileSync(path.join(root, "background.js"), "utf8");

test("importedScripts parses the importScripts list", () => {
  assert.deepStrictEqual(importedScripts('importScripts("a.js", "lib/b.js");'), ["a.js", "lib/b.js"]);
  assert.deepStrictEqual(importedScripts("nothing here"), []);
});

test("root manifest is Chrome-clean: service_worker only, no gecko key", () => {
  assert.ok(base.background.service_worker);
  assert.strictEqual(base.background.scripts, undefined);
  assert.strictEqual(base.browser_specific_settings, undefined);
});

test("chrome manifest: service_worker, no scripts, no gecko", () => {
  const { chrome } = deriveManifests(base, bgSource);
  assert.strictEqual(chrome.background.service_worker, "background.js");
  assert.strictEqual(chrome.background.scripts, undefined);
  assert.strictEqual(chrome.browser_specific_settings, undefined);
});

test("firefox manifest: scripts = importScripts list + background.js, no service_worker, gecko id", () => {
  const { firefox } = deriveManifests(base, bgSource);
  assert.strictEqual(firefox.background.service_worker, undefined);
  assert.deepStrictEqual(firefox.background.scripts, [...importedScripts(bgSource), "background.js"]);
  assert.strictEqual(firefox.browser_specific_settings.gecko.id, "dictionary-lookup@local");
  assert.strictEqual(firefox.browser_specific_settings.gecko.strict_min_version, "127.0");
});

test("deriveManifests does not mutate its input", () => {
  const copy = JSON.parse(JSON.stringify(base));
  deriveManifests(base, bgSource);
  assert.deepStrictEqual(base, copy);
});

test("toolbar button opens popup.html in both browsers", () => {
  const { chrome, firefox } = deriveManifests(base, bgSource);
  assert.strictEqual(chrome.action.default_popup, "popup.html");
  assert.strictEqual(firefox.action.default_popup, "popup.html");
});

test("every file a manifest references exists", () => {
  const { chrome, firefox } = deriveManifests(base, bgSource);
  for (const m of [chrome, firefox]) {
    const refs = [
      m.background.service_worker, ...(m.background.scripts || []),
      ...m.content_scripts.flatMap((c) => c.js),
      ...Object.values(m.icons), ...Object.values(m.action.default_icon), m.action.default_popup,
    ].filter(Boolean);
    for (const f of refs) assert.ok(fs.existsSync(path.join(root, f)), "missing " + f);
  }
});
