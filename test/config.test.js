const test = require("node:test");
const assert = require("node:assert");
const { DEFAULTS, mergeConfig, fillTemplate } = require("../lib/config.js");

test("null / non-object / empty -> defaults", () => {
  for (const raw of [null, undefined, 5, "x", [], {}]) assert.deepStrictEqual(mergeConfig(raw), DEFAULTS);
});

test("valid overrides are kept, others default", () => {
  const c = mergeConfig({ popup: { maxDefinitions: 3, showExamples: true, trigger: "doubleClick", theme: "dark" } });
  assert.strictEqual(c.popup.maxDefinitions, 3);
  assert.strictEqual(c.popup.showExamples, true);
  assert.strictEqual(c.popup.trigger, "doubleClick");
  assert.strictEqual(c.popup.theme, "dark");
  assert.strictEqual(c.popup.width, DEFAULTS.popup.width);
});

test("invalid values fall back to defaults", () => {
  const c = mergeConfig({
    popup: { maxDefinitions: 0, maxWordLength: -1, width: 3.5, enabled: "yes", trigger: "hover", theme: "pink" },
    contextMenu: { title: 5, urlTemplate: "https://x.test/no-placeholder" },
    dictionary: { apiUrlTemplate: "https://x.test/", timeoutMs: "fast" },
  });
  assert.deepStrictEqual(c, DEFAULTS);
});

test("valid templates are kept; unknown keys dropped", () => {
  const c = mergeConfig({
    contextMenu: { urlTemplate: "https://en.wiktionary.org/wiki/{query}" },
    dictionary: { apiUrlTemplate: "https://api.test/{word}", timeoutMs: 100 },
    bogus: { a: 1 },
  });
  assert.strictEqual(c.contextMenu.urlTemplate, "https://en.wiktionary.org/wiki/{query}");
  assert.strictEqual(c.dictionary.timeoutMs, 100);
  assert.strictEqual(c.bogus, undefined);
});

test("fillTemplate encodes the value", () => {
  const t = DEFAULTS.contextMenu.urlTemplate;
  const base = "https://www.merriam-webster.com/dictionary/";
  assert.strictEqual(fillTemplate(t, "query", "call a spade a spade"), base + "call%20a%20spade%20a%20spade");
  assert.strictEqual(fillTemplate(t, "query", "insolent"), base + "insolent");
  assert.ok(!/[?#/]/.test(fillTemplate(t, "query", "what?#/%").slice(base.length)));
});
