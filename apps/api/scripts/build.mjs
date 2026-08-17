import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sharedSrc = resolve(apiDir, "../../packages/shared/src/index.ts");

await build({
  entryPoints: [resolve(apiDir, "src/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  alias: { "@wedding/shared": sharedSrc },
  outfile: resolve(apiDir, "dist/index.js"),
  sourcemap: true,
  logLevel: "info",
});
