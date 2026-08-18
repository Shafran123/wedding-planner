import { readFileSync, writeFileSync } from "node:fs";

const pkgUrl = new URL("../../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));

const [major, minor, patch] = pkg.version.split(".").map(Number);
const next = `${major}.${minor}.${patch + 1}`;
pkg.version = next;

writeFileSync(pkgUrl, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(next);
