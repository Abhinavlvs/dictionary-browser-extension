const test = require("node:test");
const assert = require("node:assert");
const { createSerialQueue } = require("../lib/serial.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("tasks run one at a time, in order (no lost read-modify-write updates)", async () => {
  const run = createSerialQueue();
  let store = 0;
  const increment = async () => { const v = store; await sleep(10); store = v + 1; };
  await Promise.all([run(increment), run(increment), run(increment)]);
  assert.strictEqual(store, 3);
});

test("returns the task's result", async () => {
  const run = createSerialQueue();
  assert.strictEqual(await run(async () => 42), 42);
});

test("a failing task does not block later tasks", async () => {
  const run = createSerialQueue();
  await assert.rejects(run(async () => { throw new Error("boom"); }), /boom/);
  assert.strictEqual(await run(async () => "ok"), "ok");
});
