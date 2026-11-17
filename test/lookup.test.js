const test = require("node:test");
const assert = require("node:assert");
const hello = require("./fixtures/hello.json");
const unknown = require("./fixtures/unknown.json");
const { createLookup } = require("../lib/lookup.js");

function stub(responses) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const r = responses.shift();
    if (r instanceof Error) throw r;
    return r;
  };
  fn.calls = calls;
  return fn;
}
const okRes = (body) => ({ ok: true, status: 200, json: async () => body });

test("success returns parsed data and hits the right URL", async () => {
  const f = stub([okRes(hello)]);
  const r = await createLookup(f)("hello");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.data.word, "hello");
  assert.strictEqual(f.calls[0], "https://freedictionaryapi.com/api/v1/entries/en/hello");
});

test("second call for same word is served from cache", async () => {
  const f = stub([okRes(hello)]);
  const lookup = createLookup(f);
  await lookup("hello");
  await lookup("hello");
  assert.strictEqual(f.calls.length, 1);
});

test("not-found (entries: []) is ok and cached", async () => {
  const f = stub([okRes(unknown)]);
  const lookup = createLookup(f);
  const r = await lookup("zzzzqq");
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.data.entries, []);
  await lookup("zzzzqq");
  assert.strictEqual(f.calls.length, 1);
});

test("HTTP 500 is a failure and is not cached", async () => {
  const f = stub([{ ok: false, status: 500, json: async () => ({}) }, okRes(hello)]);
  const lookup = createLookup(f);
  assert.strictEqual((await lookup("hello")).ok, false);
  assert.strictEqual((await lookup("hello")).ok, true);
  assert.strictEqual(f.calls.length, 2);
});

test("thrown fetch error is a failure", async () => {
  const r = await createLookup(stub([new Error("offline")]))("hello");
  assert.strictEqual(r.ok, false);
  assert.ok(r.error);
});

test("word is URL-encoded", async () => {
  const f = stub([okRes(unknown)]);
  await createLookup(f)("don’t");
  assert.ok(f.calls[0].endsWith("/don%E2%80%99t"));
});
