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

test("popup.disabledHosts: default empty, valid list kept, junk filtered/rejected", () => {
  assert.deepStrictEqual(DEFAULTS.popup.disabledHosts, []);
  assert.deepStrictEqual(mergeConfig({ popup: { disabledHosts: ["a.com", "B.org"] } }).popup.disabledHosts, ["a.com", "b.org"]);
  assert.deepStrictEqual(mergeConfig({ popup: { disabledHosts: ["a.com", 5, ""] } }).popup.disabledHosts, ["a.com"]);
  assert.deepStrictEqual(mergeConfig({ popup: { disabledHosts: "a.com" } }).popup.disabledHosts, []);
});

test("URL templates must be https", () => {
  for (const bad of ["http://x.test/{query}", "javascript:alert({query})", "data:text/html,{query}", "file:///{query}", "not a url {query}"]) {
    assert.strictEqual(mergeConfig({ contextMenu: { urlTemplate: bad } }).contextMenu.urlTemplate, DEFAULTS.contextMenu.urlTemplate, bad);
  }
  assert.strictEqual(mergeConfig({ dictionary: { apiUrlTemplate: "http://x.test/{word}" } }).dictionary.apiUrlTemplate, DEFAULTS.dictionary.apiUrlTemplate);
  assert.strictEqual(mergeConfig({ contextMenu: { urlTemplate: "https://x.test/{query}" } }).contextMenu.urlTemplate, "https://x.test/{query}");
});

test("saveWords defaults on; maxSavedWords validated", () => {
  assert.strictEqual(DEFAULTS.popup.saveWords, true);
  assert.strictEqual(mergeConfig({ popup: { saveWords: false } }).popup.saveWords, false);
  assert.strictEqual(mergeConfig({ popup: { maxSavedWords: 10 } }).popup.maxSavedWords, 10);
  assert.strictEqual(mergeConfig({ popup: { maxSavedWords: 0, saveWords: "no" } }).popup.maxSavedWords, 5000);
});
