const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

test("package.json and manifest.json versions match", () => {
  assert.strictEqual(JSON.parse(read("package.json")).version, JSON.parse(read("manifest.json")).version);
});

test("CHANGELOG has an entry for the current version", () => {
  const v = JSON.parse(read("manifest.json")).version;
  assert.ok(read("CHANGELOG.md").includes("## [" + v + "]"), "CHANGELOG.md missing ## [" + v + "]");
});
