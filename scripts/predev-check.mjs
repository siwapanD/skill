#!/usr/bin/env node
// Sanity checks that run before the Next.js dev server starts.
//
// Used two ways:
//   1. npm lifecycle: package.json "predev" -> runs automatically before `dev`
//      (npm/pnpm/yarn all honor `pre<script>` before `<script>`).
//   2. Claude Code hook: .claude/hooks/predev-guard.mjs shells out to this same
//      script before letting Claude run a dev-server command, so the check can't
//      be skipped just because a human isn't the one typing `npm run dev`.
//
// Flags:
//   --strict    also run `tsc --noEmit` and eslint (slower — CI/pre-push territory)
//   --install   auto-run the package manager's install if deps look stale, instead
//               of just warning
//
// Exit code 0 = OK to start dev. Exit code 1 = hard failure, do not start dev.

import { existsSync, readFileSync, statSync } from "node:fs";
import { createConnection } from "node:net";
import { execFileSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const autoInstall = args.includes("--install");
const cwd = process.cwd();

const problems = []; // hard failures -> exit 1
const warnings = []; // soft issues -> printed, don't block

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// ---- 1. Node version -------------------------------------------------------
const pkg = readJson(path.join(cwd, "package.json"));
const requiredNode = pkg?.engines?.node;
if (requiredNode) {
  const current = process.versions.node;
  const minMajor = parseInt(requiredNode.replace(/[^\d.]/g, ""), 10);
  const currentMajor = parseInt(current.split(".")[0], 10);
  if (Number.isFinite(minMajor) && currentMajor < minMajor) {
    problems.push(
      `Node ${current} does not satisfy engines.node "${requiredNode}" in package.json.`,
    );
  }
}

// ---- 2. Env vars vs .env.example ------------------------------------------
const examplePath = path.join(cwd, ".env.example");
const localPath = path.join(cwd, ".env.local");
if (existsSync(examplePath)) {
  const exampleLines = readFileSync(examplePath, "utf8").split("\n");
  const required = exampleLines
    .map((line) => line.match(/^([A-Z0-9_]+)=.*#\s*required/i))
    .filter(Boolean)
    .map((m) => m[1]);

  if (required.length > 0) {
    if (!existsSync(localPath)) {
      problems.push(
        `.env.local is missing. Required vars: ${required.join(", ")}. Copy .env.example -> .env.local and fill them in.`,
      );
    } else {
      const localKeys = new Set(
        readFileSync(localPath, "utf8")
          .split("\n")
          .map((l) => l.match(/^([A-Z0-9_]+)=/i)?.[1])
          .filter(Boolean),
      );
      const missing = required.filter((k) => !localKeys.has(k));
      if (missing.length > 0) {
        problems.push(`.env.local is missing required var(s): ${missing.join(", ")}`);
      }
    }
  }
} else {
  warnings.push("No .env.example found — add one so predev can catch missing env vars.");
}

// ---- 3. node_modules / lockfile freshness ----------------------------------
const lockfiles = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
const lockfile = lockfiles.find((f) => existsSync(path.join(cwd, f)));
const nodeModules = path.join(cwd, "node_modules");

if (!existsSync(nodeModules)) {
  if (autoInstall && lockfile) {
    warnings.push("node_modules missing — installing...");
    const installCmd = lockfile.startsWith("pnpm")
      ? "pnpm"
      : lockfile.startsWith("yarn")
        ? "yarn"
        : lockfile.startsWith("bun")
          ? "bun"
          : "npm";
    try {
      execFileSync(installCmd, ["install"], { stdio: "inherit", cwd });
    } catch {
      problems.push(`Auto-install with ${installCmd} failed.`);
    }
  } else {
    problems.push("node_modules is missing. Run install, or re-run with --install.");
  }
} else if (lockfile) {
  const lockMtime = statSync(path.join(cwd, lockfile)).mtimeMs;
  const nmMtime = statSync(nodeModules).mtimeMs;
  if (lockMtime > nmMtime) {
    warnings.push(
      `${lockfile} is newer than node_modules — dependencies may be stale. Re-run install${autoInstall ? "" : ", or use --install"}.`,
    );
  }
}

// ---- 4. Dev port availability ----------------------------------------------
const port = Number(process.env.PORT) || 3000;
await new Promise((resolve) => {
  const socket = createConnection({ port, host: "127.0.0.1" });
  const done = (inUse) => {
    socket.destroy();
    if (inUse) warnings.push(`Port ${port} is already in use — dev server may fail to bind.`);
    resolve();
  };
  socket.once("connect", () => done(true));
  socket.once("error", () => done(false));
  socket.setTimeout(300, () => done(false));
});

// ---- 5. Strict mode: typecheck + lint --------------------------------------
if (strict) {
  try {
    execFileSync("npx", ["tsc", "--noEmit"], { stdio: "inherit", cwd });
  } catch {
    problems.push("Type errors found (tsc --noEmit failed).");
  }
  try {
    execFileSync("npx", ["eslint", "."], { stdio: "inherit", cwd });
  } catch {
    problems.push("Lint errors found (eslint failed).");
  }
}

// ---- report -----------------------------------------------------------------
for (const w of warnings) console.warn(`⚠️  ${w}`);

if (problems.length > 0) {
  console.error("\n❌ predev checks failed:");
  for (const p of problems) console.error(`   - ${p}`);
  console.error("");
  process.exit(1);
}

if (warnings.length === 0) {
  console.log("✅ predev checks passed.");
}
process.exit(0);
