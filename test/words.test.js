const test = require("node:test");
const assert = require("node:assert");
const { normalizeWord, isPrimaryClick, isEditable } = require("../lib/words.js");

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

test("normalizeWord honors maxLen argument", () => {
  assert.strictEqual(normalizeWord("insolent", 5), null);
  assert.strictEqual(normalizeWord("cat", 5), "cat");
});

test("isEditable detects form fields and contenteditable", () => {
  assert.strictEqual(isEditable({ tagName: "INPUT" }), true);
  assert.strictEqual(isEditable({ tagName: "textarea" }), true);
  assert.strictEqual(isEditable({ tagName: "DIV", isContentEditable: true }), true);
  assert.strictEqual(isEditable({ tagName: "P", isContentEditable: false }), false);
  assert.strictEqual(isEditable(null), false);
});
