const test = require("node:test");
const assert = require("node:assert");
const { normalizeWord, mwUrl } = require("../lib/words.js");

test("normalizeWord accepts and cleans single words", () => {
  assert.strictEqual(normalizeWord(" Hello, \n"), "hello");
  assert.strictEqual(normalizeWord("don’t"), "don’t");
  assert.strictEqual(normalizeWord("don't"), "don't");
  assert.strictEqual(normalizeWord("well-known"), "well-known");
});

test("normalizeWord rejects non-words", () => {
  assert.strictEqual(normalizeWord("two words"), null);
  assert.strictEqual(normalizeWord("abc123"), null);
  assert.strictEqual(normalizeWord(""), null);
  assert.strictEqual(normalizeWord("   "), null);
  assert.strictEqual(normalizeWord("a".repeat(46)), null);
});

test("mwUrl encodes phrases and words", () => {
  const base = "https://www.merriam-webster.com/dictionary/";
  assert.strictEqual(mwUrl("call a spade a spade"), base + "call%20a%20spade%20a%20spade");
  assert.strictEqual(mwUrl("insolent"), base + "insolent");
  const rest = mwUrl("what?#/%").slice(base.length);
  assert.ok(!/[?#/]/.test(rest));
});
