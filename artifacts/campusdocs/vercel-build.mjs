import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const artifactRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const workspaceRoot = resolve(artifactRoot, "../..");

console.log("Building CampusDocs from the workspace root...");
execFileSync("pnpm", ["--filter", "@workspace/campusdocs", "build"], {
  cwd: workspaceRoot,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

const output = resolve(artifactRoot, "dist/public/index.html");
if (!existsSync(output)) {
  throw new Error(`CampusDocs build did not create ${output}`);
}

console.log(`CampusDocs Vercel output ready: ${resolve(artifactRoot, "dist/public")}`);