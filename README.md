# setup-project — Claude Code template for Next.js full-stack apps

A drop-in Claude Code configuration for full-stack **Next.js (App Router) + React 19 +
TypeScript** projects. It's not a running app — it's the `.claude/` layer, the project
rules, and the "run sanity checks before the dev server starts" wiring you copy into a
real app.

## What's in here

```
setup-project/
├── CLAUDE.md                       # project rules Claude reads every session
├── eslint.config.mjs                # enforced rules: no-explicit-any, no-console, etc.
├── .claude/
│   ├── settings.json                # hooks + permission defaults
│   ├── hooks/
│   │   └── predev-guard.mjs         # PreToolUse hook: blocks `dev` until checks pass
│   └── skills/
│       │   # scaffolding — encode this repo's templates
│       ├── new-page/                # scaffold app/**/page.tsx (+ loading/layout)
│       ├── new-api-route/           # scaffold app/api/**/route.ts
│       ├── new-server-action/       # scaffold a Zod-validated Server Action
│       ├── new-component/           # scaffold a server/client component (Tailwind)
│       │   # design & discovery
│       ├── ui-ux-pro-max/           # searchable UI/UX design data (vendored, MIT; needs python3)
│       ├── reverse-engineer/        # legacy code / live UI / API / Oracle schema → verified spec
│       ├── codebase-design/         # deep-module vocabulary: module, interface, seam
│       ├── prototype/               # throwaway code to answer a design question
│       ├── research/                # cited research notes from primary sources
│       │   # workflow
│       ├── grilling/                # stress-test a plan with rounds of questions
│       ├── grill-me/                # short-form grilling interview
│       ├── tdd/                     # red → green loop at agreed seams
│       ├── diagnosing-bugs/         # build a red-capable feedback loop before theorizing
│       ├── post-mortem/             # engineering record of a validated fix
│       ├── resolving-merge-conflicts/
│       ├── handoff/                 # compact a session into a handoff doc
│       ├── writing-for-agents/      # read before editing CLAUDE.md or a skill
│       └── karpathy-guidelines/     # full text of the working principles
├── scripts/
│   └── predev-check.mjs             # the actual sanity checks (node/env/deps/port)
└── .env.example
```

## How to use it

1. Copy the pieces into your Next.js project root (merge, don't overwrite an existing
   `CLAUDE.md` or `.claude/settings.json` — see notes below):

   ```bash
   cp -r setup-project/.claude          your-app/
   cp -r setup-project/scripts          your-app/
   cp    setup-project/CLAUDE.md        your-app/
   cp    setup-project/eslint.config.mjs your-app/   # merge if you already have one
   cp    setup-project/.env.example     your-app/    # merge keys into your real .env.example
   ```

   `eslint.config.mjs` needs `@eslint/eslintrc` as a dev dependency (used for the
   `FlatCompat` shim that lets flat config extend the legacy `next/core-web-vitals`
   preset) — `create-next-app` installs it by default, so this is usually already
   there. If not: `pnpm add -D @eslint/eslintrc`.

2. Wire the npm lifecycle hook into `your-app/package.json` so the checks run
   **every time `dev` starts**, whether a human or Claude runs it:

   ```json
   {
     "scripts": {
       "predev": "node scripts/predev-check.mjs",
       "dev": "next dev --turbopack",
       "predev:strict": "node scripts/predev-check.mjs --strict"
     }
   }
   ```

   npm, pnpm, and yarn all auto-run a `pre<script>` script before `<script>`, so
   `npm run dev` / `pnpm dev` / `yarn dev` triggers `predev` for free — no extra flags.

3. The Claude Code side is already covered by `.claude/settings.json`: a `PreToolUse`
   hook watches every `Bash` tool call, and when the command looks like a dev-server
   launch (`next dev`, `npm run dev`, `pnpm dev`, `yarn dev`, `bun dev`) it runs the same
   `scripts/predev-check.mjs` first. If checks fail, the hook exits 2, Claude sees the
   failure reason on stderr, and the `dev` command is never executed. This is the
   "Claude before dev" behavior — Claude cannot start a broken dev server and route
   around your safety checks.

4. Fill in real values in `.env.example` for your stack (DB URL, auth secret, API keys)
   — `predev-check.mjs` diffs `.env.local` against it and fails on missing **required**
   keys (marked `# required` in the example file).

## Customizing

- **Strictness**: by default `predev-check.mjs` only checks Node version, `.env.local`
  completeness, `node_modules`/lockfile freshness, and port availability (fast, ~200ms).
  Pass `--strict` to also run `tsc --noEmit` and `eslint` — do this in CI or pre-push,
  not on every `dev` boot, unless your project is small.
- **Auto-install**: pass `--install` to have it run your package manager's install when
  `node_modules` is missing/stale instead of just warning.
- **Permissions**: `.claude/settings.json` ships a conservative allow-list for read-only
  and common dev commands. Extend it as your workflow needs, don't broaden it blindly.
- **Skills**: the four `new-*` skills are scaffolding recipes written for App Router
  conventions. Edit them to match your actual folder structure/ORM/auth choice once you
  pick one — they're deliberately written with a couple of decision points called out
  rather than hard-coding a stack. The rest are workflow and design skills (see the tree
  above and `CLAUDE.md`'s **Skills** section); `ui-ux-pro-max` needs `python3` on the
  machine to run its search script.

## Verifying the hook actually blocks

```bash
cd your-app
rm -f .env.local   # simulate a missing required env var
echo '{"tool_name":"Bash","tool_input":{"command":"npm run dev"}}' \
  | node .claude/hooks/predev-guard.mjs; echo "exit: $?"
```

You should see the failure reason on stderr and `exit: 2`. Restore `.env.local` and
re-run — it should exit `0` with no output.
