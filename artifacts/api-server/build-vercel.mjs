import { build } from "esbuild";
import { createRequire } from "node:module";

// Keep the logging packages external so their worker files are resolved from
// the installed Vercel function dependencies instead of being emitted into
// the bundle with colliding names.
globalThis.require = createRequire(import.meta.url);

await build({
  entryPoints: ["./src/app.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "./dist/vercel.cjs",
  sourcemap: true,
  logLevel: "info",
  external: [
    "*.node",
    "sharp",
    "better-sqlite3",
    "sqlite3",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "re2",
    "farmhash",
    "xxhash-addon",
    "bufferutil",
    "utf-8-validate",
    "pg-native",
    "oracledb",
    "mongodb-client-encryption",
    "lightningcss",
    "pino",
    "pino-http",
    "pino-pretty",
    "thread-stream",
  ],
});