import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const run = (args) => {
  console.log(`Running: pnpm ${args.join(" ")}`);
  execFileSync("pnpm", args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
};

run(["--filter", "@workspace/campusdocs", "build"]);
run(["--filter", "@workspace/api-server", "build:vercel"]);

const frontendOutput = resolve(
  projectRoot,
  "artifacts",
  "campusdocs",
  "dist",
  "public",
);
const vercelOutput = resolve(projectRoot, "public");

if (!existsSync(resolve(frontendOutput, "index.html"))) {
  throw new Error(`Frontend build did not create ${frontendOutput}/index.html`);
}

rmSync(vercelOutput, { recursive: true, force: true });
cpSync(frontendOutput, vercelOutput, { recursive: true });

if (!existsSync(resolve(vercelOutput, "index.html"))) {
  throw new Error(`Vercel output was not created at ${vercelOutput}/index.html`);
}

console.log(`Vercel static output ready: ${vercelOutput}`);