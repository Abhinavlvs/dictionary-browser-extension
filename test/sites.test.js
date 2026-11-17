const test = require("node:test");
const assert = require("node:assert");
const { hostOf, isEnabled, toggleOverrides } = require("../lib/sites.js");

test("hostOf: http(s) only, lowercased, null otherwise", () => {
  assert.strictEqual(hostOf("https://En.Wikipedia.org/wiki/Cat?x=1"), "en.wikipedia.org");
  assert.strictEqual(hostOf("http://localhost:3000/a"), "localhost");
  assert.strictEqual(hostOf("file:///tmp/a.html"), null);
  assert.strictEqual(hostOf("chrome://extensions"), null);
  assert.strictEqual(hostOf("about:blank"), null);
  assert.strictEqual(hostOf("not a url"), null);
  assert.strictEqual(hostOf(undefined), null);
});

test("isEnabled: default on, config list disables, override wins", () => {
  assert.strictEqual(isEnabled("a.com", [], {}), true);
  assert.strictEqual(isEnabled("a.com", ["a.com"], {}), false);
  assert.strictEqual(isEnabled("A.com", ["a.COM"], {}), false);
  assert.strictEqual(isEnabled("a.com", ["a.com"], { "a.com": true }), true);
  assert.strictEqual(isEnabled("a.com", [], { "a.com": false }), false);
  assert.strictEqual(isEnabled("a.com", [], null), true);
});

test("toggleOverrides flips state and keeps storage minimal", () => {
  let o = toggleOverrides("a.com", [], {});
  assert.deepStrictEqual(o, { "a.com": false });
  o = toggleOverrides("a.com", [], o); // back to default -> key removed
  assert.deepStrictEqual(o, {});
  o = toggleOverrides("b.com", ["b.com"], {});
  assert.deepStrictEqual(o, { "b.com": true });
  const orig = { "x.com": false };
  toggleOverrides("a.com", [], orig);
  assert.deepStrictEqual(orig, { "x.com": false }); // input not mutated
});
