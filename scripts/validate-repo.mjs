import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const projects = [...new Set(tracked.map((file) => file.split("/")[0]))]
  .filter((name) => /^\d{2}-/.test(name))
  .sort();

if (projects.length !== 14) {
  throw new Error(`Expected 14 numbered projects, found ${projects.length}.`);
}

const required = [
  "Helpers/Consts.js",
  "Helpers/Helper Functions.js",
  "Setup.js",
  "Main.js",
  "README.md",
  "appsscript.json",
];

for (const project of projects) {
  for (const relative of required) {
    const path = join(root, project, relative);
    if (!existsSync(path)) throw new Error(`Missing ${project}/${relative}.`);
  }
}

for (const file of tracked.filter((name) => name.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", join(root, file)], {
    cwd: root,
    stdio: "pipe",
  });
}

for (const project of projects) {
  const manifestPath = join(root, project, "appsscript.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.runtimeVersion !== "V8") {
    throw new Error(`${project}/appsscript.json must use the V8 runtime.`);
  }
}

const forbiddenTrackedFiles = tracked.filter((file) =>
  /(^|\/)(\.clasp\.json|\.clasprc\.json)$/.test(file),
);
if (forbiddenTrackedFiles.length) {
  throw new Error(`Tracked clasp credentials: ${forbiddenTrackedFiles.join(", ")}`);
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bAKfy[0-9A-Za-z_-]{20,}\b/,
];
for (const file of tracked.filter((name) => /\.(?:js|html|json|md|yml|yaml)$/.test(name))) {
  const contents = readFileSync(join(root, file), "utf8");
  const match = secretPatterns.find((pattern) => pattern.test(contents));
  if (match) throw new Error(`Possible credential or deployment identifier in ${file}.`);
}

console.log(`Validated ${projects.length} Apps Script projects and ${tracked.length} tracked files.`);
