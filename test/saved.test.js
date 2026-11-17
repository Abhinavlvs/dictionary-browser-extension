const test = require("node:test");
const assert = require("node:assert");
const { recordWord, removeWord, sortedEntries, toCsv } = require("../lib/saved.js");

const item = (word, definition = "d", partOfSpeech = "noun") => ({ word, definition, partOfSpeech });

test("recordWord adds a new word with count 1 and timestamps", () => {
  const s = recordWord({}, item("Hello", "a greeting", "interjection"), 100, 10);
  assert.deepStrictEqual(s.hello, {
    word: "Hello", definition: "a greeting", partOfSpeech: "interjection", count: 1, firstSeen: 100, lastSeen: 100,
  });
});

test("recordWord on a known word bumps count and lastSeen only (case-insensitive key)", () => {
  let s = recordWord({}, item("hello", "first"), 100, 10);
  s = recordWord(s, item("HELLO", "second"), 200, 10);
  assert.strictEqual(Object.keys(s).length, 1);
  assert.strictEqual(s.hello.count, 2);
  assert.strictEqual(s.hello.firstSeen, 100);
  assert.strictEqual(s.hello.lastSeen, 200);
  assert.strictEqual(s.hello.definition, "first");
});

test("recordWord does not mutate its input", () => {
  const before = recordWord({}, item("a"), 1, 10);
  const snapshot = JSON.stringify(before);
  recordWord(before, item("b"), 2, 10);
  assert.strictEqual(JSON.stringify(before), snapshot);
});

test("recordWord evicts the least recently seen word beyond max", () => {
  let s = {};
  s = recordWord(s, item("a"), 1, 2);
  s = recordWord(s, item("b"), 2, 2);
  s = recordWord(s, item("a"), 3, 2); // a is now newest
  s = recordWord(s, item("c"), 4, 2);
  assert.deepStrictEqual(Object.keys(s).sort(), ["a", "c"]);
});

test("recordWord ignores junk input and prototype keys", () => {
  assert.deepStrictEqual(recordWord({}, null, 1, 5), {});
  assert.deepStrictEqual(recordWord({}, item(""), 1, 5), {});
  const s = recordWord({}, item("__proto__"), 1, 5);
  assert.strictEqual(Object.getPrototypeOf(s), Object.prototype);
  assert.strictEqual(Object.keys(s).length, 1);
  assert.strictEqual(({}).count, undefined);
});

test("recordWord tolerates a corrupt store", () => {
  assert.strictEqual(recordWord(null, item("a"), 1, 5).a.count, 1);
  assert.strictEqual(recordWord([1, 2], item("a"), 1, 5).a.count, 1);
});

test("removeWord and sortedEntries (newest first)", () => {
  let s = recordWord({}, item("a"), 1, 10);
  s = recordWord(s, item("b"), 2, 10);
  assert.deepStrictEqual(sortedEntries(s).map((e) => e.word), ["b", "a"]);
  assert.deepStrictEqual(Object.keys(removeWord(s, "A")), ["b"]);
});

test("toCsv quotes fields and neutralises spreadsheet formulas", () => {
  const s = recordWord({}, item("x", 'says "hi", ok'), 0, 10);
  const s2 = recordWord(s, item("=cmd", "-1+1"), 5, 10);
  const lines = toCsv(sortedEntries(s2)).split("\r\n");
  assert.strictEqual(lines[0], "word,part_of_speech,definition,count,first_seen,last_seen");
  assert.ok(lines[1].startsWith("'=cmd,noun,'-1+1,1,"));
  assert.ok(lines[2].includes('"says ""hi"", ok"'));
});

const { mergeStores, toJson, parseImport } = require("../lib/saved.js");

test("mergeStores adds counts, keeps earliest firstSeen and latest lastSeen", () => {
  let a = recordWord({}, item("hello", "from a"), 100, 10);
  a = recordWord(a, item("hello"), 300, 10);
  const b = recordWord(recordWord({}, item("hello", "from b"), 50, 10), item("only-b"), 400, 10);
  const m = mergeStores(a, b, 10);
  assert.strictEqual(m.hello.count, 3);
  assert.strictEqual(m.hello.firstSeen, 50);
  assert.strictEqual(m.hello.lastSeen, 300);
  assert.strictEqual(m.hello.definition, "from a");
  assert.ok(m["only-b"]);
});

test("mergeStores enforces max and does not mutate inputs", () => {
  const a = recordWord({}, item("a"), 1, 10);
  const b = recordWord({}, item("b"), 2, 10);
  const sa = JSON.stringify(a);
  assert.deepStrictEqual(Object.keys(mergeStores(a, b, 1)), ["b"]);
  assert.strictEqual(JSON.stringify(a), sa);
});

test("toJson then parseImport round-trips", () => {
  const s = recordWord(recordWord({}, item("a", "d1"), 1, 10), item("b", "d2"), 2, 10);
  const r = parseImport(toJson(s));
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.store, s);
});

test("parseImport rejects junk and sanitises entries", () => {
  assert.strictEqual(parseImport("not json").ok, false);
  assert.strictEqual(parseImport("[]").ok, false);
  assert.strictEqual(parseImport(JSON.stringify({ format: "other", words: [] })).ok, false);
  const r = parseImport(JSON.stringify({
    format: "dictionary-lookup-saved-words", version: 1,
    words: [{ word: "ok", definition: "d", count: 2, firstSeen: 1, lastSeen: 2 }, { word: 5 }, null, { word: "bad", count: -4, firstSeen: "x", lastSeen: 3 }],
  }));
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(Object.keys(r.store).sort(), ["bad", "ok"]);
  assert.strictEqual(r.store.bad.count, 1);
  assert.strictEqual(r.store.bad.firstSeen, 3);
});
