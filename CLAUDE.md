# Project rules — Next.js + Oracle full-stack

Read this before touching code. It encodes the stack's conventions and the operating
rules for how Claude should work in this repo — from local dev all the way to
production. Keep it in sync with reality — if a rule here stops matching the code, fix
the rule or the code, don't let them drift apart.

## Working principles (Karpathy-inspired)

These govern *how* Claude works here, before any code is written. Full version in
`.claude/skills/karpathy-guidelines` — this is the summary. Tradeoff: they bias
toward caution over speed — for trivial tasks, use judgment.

1. **Think before coding.** State assumptions explicitly; if multiple interpretations
   exist, present them — don't pick silently. If something is unclear, stop and ask.
   If a simpler approach exists than what was asked for, say so.
2. **Simplicity first.** Minimum code that solves the problem. No speculative features,
   no abstractions for single-use code, no unrequested "flexibility", no error handling
   for impossible scenarios. If 200 lines could be 50, rewrite it.
3. **Surgical changes.** Every changed line should trace directly to the request.
   Don't "improve" adjacent code, comments, or formatting; don't refactor what isn't
   broken; match existing style. Remove only orphans *your* change created — mention
   pre-existing dead code, don't delete it.
4. **Goal-driven execution.** Turn tasks into verifiable goals ("fix the bug" → "write
   a test that reproduces it, then make it pass"). For multi-step work, state a brief
   plan with a verify step per item, and loop until the checks actually pass.

## Skills (`.claude/skills/`)

Scaffolding: `new-page`, `new-component`, `new-api-route`, `new-server-action` — use
these instead of hand-rolling boilerplate; they encode this repo's templates.

Workflow (adapted from mattpocock/skills; they operationalize the principles above):

- `grilling` / `grill-me` — stress-test a plan with rounds of questions before building
  (principle 1 in practice). Use before any non-trivial feature.
- `tdd` — red → green loop, tests at agreed seams only (principle 4 in practice).
- `diagnosing-bugs` — for hard bugs: build a tight red-capable feedback loop *before*
  hypothesizing. No repro command, no theory.
- `codebase-design` — shared vocabulary (module, interface, seam, depth) for designing
  deep modules; consult when shaping an interface or deciding where a seam goes.
- `prototype` — throwaway code that answers a design question; never merged to main.
- `research` — delegate doc/API investigation to a background agent, findings land as
  a cited Markdown file.
- `resolving-merge-conflicts` — resolve by intent, hunk by hunk; never `--abort`.
- `handoff` — compact a long session into a handoff doc for the next agent.
- `writing-for-agents` — read before editing this file or any skill.
- `karpathy-guidelines` — full text of the working principles above.

## Hard rules — know these before you write a line

Enforced by `eslint.config.mjs`. Don't write code that violates these and rely on lint to
catch it afterward — write it correct the first time.

- **Never use `any`.** Use `unknown` + a type guard, a Zod-inferred type, or a precise
  interface. If a third-party type genuinely forces it, disable that one line with a
  reason: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <why>`.
- **Never leave an unused variable, import, or param.** Delete it, or prefix with `_`
  only when the name is required by a signature you don't control.
- **Never use `!` (non-null assertion)** to silence a null check you skipped — guard it
  for real (`if (!x) return`, optional chaining, etc.).
- **Never leave `console.log`** in app code (`console.warn`/`console.error` are fine).
  Exempt: `scripts/**` and `.claude/hooks/**`, which are CLI tools, not app code.
- **Always use `===`/`!==`**, except `== null` (intentional null-or-undefined check).
- **Use `const`**, not `let`, for anything never reassigned.

## Stack — pinned. Claude must use these; don't substitute alternatives.

- **Framework**: Next.js 15+ App Router only. No Pages Router, no `getServerSideProps`.
- **Runtime**: React 19 (Server Components by default, Actions, `use`).
- **Language**: TypeScript, `strict: true`. See **Hard rules** above for `any` and friends.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`
  unless you need JS-level theme extension).
- **Validation**: Zod schemas, colocated with the code that uses them, shared between
  client and server where the same shape is validated twice.
- **Data layer**: **Oracle Database** via **`node-oracledb` (thin mode)** — no Oracle
  Instant Client needed. Prisma and Drizzle do **not** support Oracle; don't try to
  introduce them. Plain SQL with bind variables through a shared connection pool
  (`lib/db/pool.ts`). If a query builder ever becomes necessary, it's TypeORM or Knex
  (both support Oracle) — decide once, note it here, and don't mix.
- **Auth**: Auth.js (NextAuth v5).
- **Package manager**: pnpm (fastest installs, strict node_modules). Use whatever the
  lockfile in the repo says — don't introduce a second lockfile.
- **Testing**: Vitest + React Testing Library for units, Playwright for e2e/integration.
- **Lint/format**: ESLint (`next/core-web-vitals`, `next/typescript` + the rules in
  **Hard rules** above, see `eslint.config.mjs`) + Prettier, or Biome as a single faster
  replacement for both — don't run both.

## Directory conventions

```
app/
  (marketing)/            # route group, no URL segment — public pages
  (app)/                  # route group — authenticated app shell
    dashboard/
      page.tsx
      loading.tsx
      error.tsx
  api/
    <resource>/route.ts   # Route Handlers: webhooks, public/external-facing APIs only
  actions/
    <feature>.ts           # Server Actions: internal mutations from forms/UI
components/
  ui/                      # generic, no business logic (buttons, inputs, dialogs)
  <feature>/                # feature-specific components
lib/
  db/
    pool.ts                # node-oracledb pool singleton — the only place a connection opens
    queries/<feature>.ts   # typed query functions (SQL + bind vars + row mappers)
    migrations/            # versioned SQL files: 0001_<desc>.sql, applied in order
  validation/              # shared Zod schemas
  utils.ts
```

- Route Handlers (`app/api/**/route.ts`) are for things that need a stable URL: webhooks,
  third-party callbacks, endpoints consumed by non-browser clients. Everything else —
  form submissions, button clicks that mutate data — goes through **Server Actions**.
- Colocate a component's test next to it: `button.tsx` + `button.test.tsx`.
- Prefer Server Components. Add `"use client"` only at the leaf that actually needs
  interactivity/state/browser APIs, not at the top of a page.

## Data & mutations

- Reads: fetch directly in Server Components (`async function Page()`), no client-side
  `useEffect` fetch waterfalls for data the server already knows how to get.
- Writes: Server Actions with a Zod-validated input, explicit return type
  (`{ success: true, data } | { success: false, error }` — see `.claude/skills/new-server-action`
  for the exact template), never throw across the server/client boundary for expected
  validation failures — throw only for genuine bugs.
- Revalidate what you touch: `revalidatePath`/`revalidateTag` after a mutation that
  changes displayed data. Don't blanket-revalidate the whole app.
- Never trust `params`/`searchParams`/form data without validating — Zod-parse at the
  boundary before it touches the data layer.

## Oracle conventions

- **One pool, opened once.** `lib/db/pool.ts` owns the `node-oracledb` pool (created
  lazily, reused across requests). Nothing else calls `oracledb.getConnection` with
  raw credentials. Always `connection.close()` in a `finally` (or use a
  `withConnection(fn)` helper) — leaked connections exhaust the pool silently.
- **Bind variables, always.** `WHERE id = :id` with `{ id }` — never string-interpolate
  values into SQL. This is both the injection defense and what lets Oracle cache
  execution plans.
- **Typed rows at the edge.** `node-oracledb` returns loosely-typed rows; map them to a
  declared interface (or Zod-parse them) inside `lib/db/queries/` so `any` never leaks
  out of the data layer. Use `outFormat: OUT_FORMAT_OBJECT`.
- **Migrations are versioned SQL files** in `lib/db/migrations/`, numbered and applied
  in order, forward-only. Never edit an applied migration — write a new one. Schema
  changes happen only through migrations, never by hand against a shared database.
- **Transactions**: `node-oracledb` autocommit is off by default — commit explicitly;
  multi-statement mutations wrap in one transaction with rollback on error.
- Oracle-isms to remember: identifiers are UPPERCASE unless quoted, `VARCHAR2` not
  `VARCHAR`, empty string is `NULL`, pagination is `OFFSET :o ROWS FETCH NEXT :n ROWS ONLY`.

## Path to production

Claude is used end-to-end here — build, review, and ship. The gates below are what
"ready" means; nothing is called production-ready without passing them.

1. **Local gates, in order**: `tsc --noEmit` → lint → unit tests (Vitest) → `next build`.
   A change that hasn't survived `next build` is not done — dev mode hides RSC and
   type errors that the production build surfaces.
2. **e2e for user-facing flows**: Playwright covers each critical path (auth, the main
   CRUD flows). New user-facing behavior lands with at least a happy-path e2e test.
3. **Env parity**: every env var in `.env.example`, real values injected by the host's
   secret store — never committed, never `NEXT_PUBLIC_` unless truly public. Oracle
   connection config (`ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`,
   pool sizes) is server-only.
4. **Migrations ship first.** A release that needs a schema change applies the
   migration before (or safely alongside) the code that depends on it — additive
   first, destructive cleanup in a later release once nothing reads the old shape.
5. **Claude never deploys or pushes without being asked** (operating rule 5 below), and
   never runs destructive SQL against a non-local database. Production incidents get a
   diagnosis and a proposed fix, not an unprompted hotfix.
6. **Observability**: errors reach a log/monitoring sink via `console.error` in
   `error.tsx` boundaries and server-side catch blocks — silent `catch {}` is a bug.

## Environment & secrets

- Every env var the app reads must appear in `.env.example` with a `# required` or
  `# optional` comment. `scripts/predev-check.mjs` enforces this before `dev` starts.
- Nothing under `.env*` (except `.env.example`) is ever committed — verify `.gitignore`
  covers it before adding a new env file.
- Server-only secrets never get a `NEXT_PUBLIC_` prefix. If it's prefixed
  `NEXT_PUBLIC_`, treat it as public even if it doesn't feel like it.

## Operating rules for Claude in this repo

1. **Before declaring anything done**: run typecheck (`tsc --noEmit`) and lint. If the
   task touched runtime behavior, run the relevant tests. Don't say "done" on faith.
2. **Don't add a dependency** without checking if the stdlib/an existing dependency
   already covers it, and without saying which one you're adding and why.
3. **Follow existing patterns** in the file/feature you're editing over patterns in this
   doc if they conflict — this doc is the default for new code, not a mandate to
   rewrite working code to match it.
4. **Don't create new files/abstractions** for something that fits in an existing file
   unless the project's own structure (see above) calls for a new one.
5. **Ask before**: adding a new top-level dependency category (ORM, auth provider, state
   library), running destructive DB operations, or pushing/deploying.
6. **The `dev` server**: don't route around the predev hook (e.g. by running
   `next dev` directly to dodge a failing check) — if the check is wrong, fix the check,
   don't bypass it.
7. **Migrations**: never hand-edit a generated migration file; regenerate it from the
   schema change instead.

## Commit conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- One logical change per commit. Don't bundle an unrelated formatting pass into a
  feature commit.
