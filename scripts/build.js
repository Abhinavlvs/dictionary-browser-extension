// Builds browser-specific packages. Chrome MV3 rejects background.scripts and Firefox ignores
// background.service_worker, so manifest.json (Chrome form) is the source and the Firefox form is derived.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const GECKO = { id: "dictionary-lookup@local", strict_min_version: "127.0" };
const SHIPPED = ["background.js", "content.js", "card.js", "saved.html", "saved.css", "saved.js", "popup.html", "popup.js", "config.json", "lib", "icons", "README.md"];

const clone = (o) => JSON.parse(JSON.stringify(o));

// Scripts the service worker loads via importScripts(...); Firefox needs the same list as background.scripts.
function importedScripts(source) {
  const m = source.match(/importScripts\(([^)]*)\)/);
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
}

function deriveManifests(base, backgroundSource) {
  const chrome = clone(base);
  const firefox = clone(base);
  firefox.background = { scripts: [...importedScripts(backgroundSource), "background.js"] };
  firefox.browser_specific_settings = { gecko: { ...GECKO } };
  return { chrome, firefox };
}

function build(root) {
  const base = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const bgSource = fs.readFileSync(path.join(root, "background.js"), "utf8");
  const manifests = deriveManifests(base, bgSource);
  const dist = path.join(root, "dist");
  fs.rmSync(dist, { recursive: true, force: true });
  const out = {};
  for (const [target, manifest] of Object.entries(manifests)) {
    const dir = path.join(dist, target);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of SHIPPED) fs.cpSync(path.join(root, f), path.join(dir, f), { recursive: true });
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    const ext = target === "firefox" ? "xpi" : "zip";
    const archive = path.join(dist, `dictionary-lookup-${base.version}-${target}.${ext}`);
    execFileSync("zip", ["-q", "-r", "-X", archive, ".", "-x", "*.DS_Store"], { cwd: dir });
    out[target] = { dir, archive };
  }
  return out;
}

if (require.main === module) {
  const out = build(path.join(__dirname, ".."));
  for (const [t, o] of Object.entries(out)) console.log(`${t}: ${o.archive}  (unpacked: ${o.dir})`);
}

module.exports = { deriveManifests, importedScripts, build };
