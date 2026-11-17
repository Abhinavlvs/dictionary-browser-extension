const test = require("node:test");
const assert = require("node:assert");
const { normalizeWord, isPrimaryClick } = require("../lib/words.js");

test("normalizeWord accepts and cleans single words", () => {
  assert.strictEqual(normalizeWord(" Hello, \n"), "hello");
  assert.strictEqual(normalizeWord("don’t"), "don't");
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

test("isPrimaryClick only accepts the left button", () => {
  assert.strictEqual(isPrimaryClick({ button: 0 }), true);
  assert.strictEqual(isPrimaryClick({ button: 2 }), false);
  assert.strictEqual(isPrimaryClick({ button: 1 }), false);
});
