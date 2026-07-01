// Assembles the plugin contents and produces a signed plugin zip.
// Run "npm run build" first so dist/desktop.js and dist/config.js exist.
// A private key (private.ppk) is generated on first run and reused after that.
// The key is never committed (see .gitignore); keep it to publish updates
// under the same plugin id.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import packer from "@kintone/plugin-packer";

const CONTENTS = "plugin-contents";
const OUT = "dist/plugin.zip";
const PPK = "private.ppk";

// Stage the files referenced by plugin/manifest.json into a flat directory.
rmSync(CONTENTS, { recursive: true, force: true });
mkdirSync(CONTENTS, { recursive: true });
cpSync("plugin/manifest.json", `${CONTENTS}/manifest.json`);
cpSync("plugin/icon.png", `${CONTENTS}/icon.png`);
cpSync("src/config/config.html", `${CONTENTS}/config.html`);
cpSync("dist/desktop.js", `${CONTENTS}/desktop.js`);
cpSync("dist/config.js", `${CONTENTS}/config.js`);

// Zip the staged directory. Prefer a portable zip via the system tool; fall
// back to failing with a clear message rather than shipping an empty archive.
const zipPath = "dist/contents.zip";
rmSync(zipPath, { force: true });
execFileSync("zip", ["-r", "-X", `../${zipPath}`, "."], { cwd: CONTENTS });

const contentsZip = readFileSync(zipPath);
const ppk = existsSync(PPK) ? readFileSync(PPK, "utf8") : null;

const { plugin, privateKey, id } = await packer(contentsZip, ppk ?? undefined);

if (!ppk) {
  writeFileSync(PPK, privateKey);
  console.log(`Generated new ${PPK}. Keep it to publish updates under id ${id}.`);
}

writeFileSync(OUT, plugin);
console.log(`Wrote ${OUT} (plugin id ${id}).`);
