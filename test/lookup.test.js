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
const okRes = (body, type = "application/json; charset=utf-8") => ({
  ok: true, status: 200,
  headers: { get: (h) => (h.toLowerCase() === "content-type" ? type : null) },
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

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
  const f = stub([{ ok: false, status: 500, headers: { get: () => null }, text: async () => "" }, okRes(hello)]);
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

test("custom apiUrlTemplate is used", async () => {
  const f = stub([okRes(unknown)]);
  await createLookup(f, { apiUrlTemplate: "https://api.test/v2/{word}/x" })("cat");
  assert.strictEqual(f.calls[0], "https://api.test/v2/cat/x");
});

test("hung fetch times out as a failure", async () => {
  const hang = (url, opts) =>
    new Promise((_, reject) => opts.signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const t0 = Date.now();
  const r = await createLookup(hang, { timeoutMs: 20 })("hello");
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /timeout/i);
  assert.ok(Date.now() - t0 < 1000);
});

test("fetch is hardened: no credentials, no referrer, redirects rejected", async () => {
  let seen;
  const f = async (url, opts) => { seen = opts; return okRes(unknown); };
  await createLookup(f)("cat");
  assert.strictEqual(seen.credentials, "omit");
  assert.strictEqual(seen.referrerPolicy, "no-referrer");
  assert.strictEqual(seen.redirect, "error");
  assert.ok(seen.signal);
});

test("non-JSON content-type is rejected", async () => {
  const r = await createLookup(stub([okRes("<html></html>", "text/html")]))("cat");
  assert.strictEqual(r.ok, false);
});

test("oversized body is rejected", async () => {
  const r = await createLookup(stub([okRes("x".repeat(600 * 1024))]))("cat");
  assert.strictEqual(r.ok, false);
});

test("invalid JSON is a failure, not a throw", async () => {
  const r = await createLookup(stub([okRes("{nope")]))("cat");
  assert.strictEqual(r.ok, false);
});

test("concurrent lookups of the same word share one request", async () => {
  const f = stub([okRes(hello)]);
  const lookup = createLookup(f);
  const [a, b] = await Promise.all([lookup("hello"), lookup("hello")]);
  assert.strictEqual(f.calls.length, 1);
  assert.strictEqual(a.ok && b.ok, true);
});

test("cache is bounded (oldest evicted)", async () => {
  const f = async () => okRes(unknown);
  let n = 0;
  const counting = async (u, o) => { n++; return f(u, o); };
  const lookup = createLookup(counting, { maxCacheEntries: 2 });
  await lookup("aa"); await lookup("bb"); await lookup("cc"); // evicts aa
  await lookup("cc"); await lookup("bb"); // cached
  assert.strictEqual(n, 3);
  await lookup("aa"); // refetched
  assert.strictEqual(n, 4);
});
