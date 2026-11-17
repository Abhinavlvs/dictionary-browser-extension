const test = require("node:test");
const assert = require("node:assert");
const hello = require("./fixtures/hello.json");
const unknown = require("./fixtures/unknown.json");
const { parseResponse, flattenDefinitions, firstIpa } = require("../lib/parse.js");

test("parseResponse keeps word, pos, definition and examples", () => {
  const p = parseResponse(hello);
  assert.strictEqual(p.word, "hello");
  assert.strictEqual(p.entries[0].partOfSpeech, "interjection");
  assert.ok(p.entries[0].senses[0].definition.startsWith("A greeting (salutation)"));
  assert.strictEqual(p.entries[0].senses[0].examples[0], "Hello, everyone.");
});

test("parseResponse handles empty entries", () => {
  assert.deepStrictEqual(parseResponse(unknown).entries, []);
});

test("parseResponse fills missing fields with defaults", () => {
  const p = parseResponse({ word: "x", entries: [{ senses: [{ definition: "d" }] }] });
  assert.strictEqual(p.entries[0].partOfSpeech, "");
  assert.deepStrictEqual(p.entries[0].pronunciations, []);
  assert.deepStrictEqual(p.entries[0].senses[0].synonyms, []);
  assert.deepStrictEqual(p.entries[0].senses[0].subsenses, []);
});

test("flattenDefinitions respects limit", () => {
  const p = parseResponse(hello);
  assert.ok(flattenDefinitions(p, 5).length <= 5);
  assert.strictEqual(flattenDefinitions(p, 1).length, 1);
  assert.deepStrictEqual(Object.keys(flattenDefinitions(p, 1)[0]).sort(), ["definition", "examples", "partOfSpeech"]);
});

test("firstIpa", () => {
  assert.strictEqual(firstIpa(parseResponse(hello)), "/hɛˈloʊ/");
  assert.strictEqual(firstIpa(parseResponse(unknown)), null);
});

test("deeply nested subsenses are bounded (no stack overflow)", () => {
  let node = { definition: "leaf" };
  for (let i = 0; i < 100000; i++) node = { definition: "d", subsenses: [node] };
  const p = parseResponse({ word: "x", entries: [{ senses: [node] }] });
  let depth = 0, cur = p.entries[0].senses[0];
  while (cur.subsenses.length) { cur = cur.subsenses[0]; depth++; }
  assert.ok(depth <= 10);
});
