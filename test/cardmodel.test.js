const test = require("node:test");
const assert = require("node:assert");
const hello = require("./fixtures/hello.json");
const unknown = require("./fixtures/unknown.json");
const { parseResponse } = require("../lib/parse.js");
const { cardModel } = require("../lib/cardmodel.js");

const ok = (j) => ({ ok: true, data: parseResponse(j) });

test("default: up to 5 items, examples kept but collapsed", () => {
  const m = cardModel(ok(hello));
  assert.strictEqual(m.state, "ok");
  assert.strictEqual(m.word, "hello");
  assert.ok(m.items.length >= 1 && m.items.length <= 5);
  assert.strictEqual(m.examplesOpen, false);
  assert.strictEqual(m.hasExamples, true);
  assert.strictEqual(m.items[0].examples[0], "Hello, everyone.");
  assert.strictEqual(m.ipa, "/hɛˈloʊ/");
});

test("showExamples opens examples initially", () => {
  assert.strictEqual(cardModel(ok(hello), { showExamples: true }).examplesOpen, true);
});

test("hasExamples false when no sense has examples", () => {
  const j = { word: "x", entries: [{ senses: [{ definition: "d" }] }] };
  assert.strictEqual(cardModel(ok(j)).hasExamples, false);
});

test("limit option", () => {
  assert.strictEqual(cardModel(ok(hello), { limit: 1 }).items.length, 1);
});

test("unknown word -> notfound", () => {
  assert.strictEqual(cardModel(ok(unknown)).state, "notfound");
});

test("failure -> error", () => {
  assert.strictEqual(cardModel({ ok: false, error: "x" }).state, "error");
});

test("showPronunciation false hides ipa", () => {
  assert.strictEqual(cardModel(ok(hello), { showPronunciation: false }).ipa, null);
});

test("error state carries the reason", () => {
  assert.deepStrictEqual(cardModel({ ok: false, error: "timeout" }), { state: "error", error: "timeout" });
  assert.strictEqual(cardModel(null).state, "error");
});
