# Project rules — Next.js full-stack

Read this before touching code. It encodes the stack's conventions and the operating
rules for how Claude should work in this repo. Keep it in sync with reality — if a rule
here stops matching the code, fix the rule or the code, don't let them drift apart.

## Stack (fill in / confirm per project)

- **Framework**: Next.js 15+ App Router only. No Pages Router, no `getServerSideProps`.
- **Runtime**: React 19 (Server Components by default, Actions, `use`).
- **Language**: TypeScript, `strict: true`. No `any` without a `// eslint-disable` comment
  explaining why.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`
  unless you need JS-level theme extension).
- **Validation**: Zod schemas, colocated with the code that uses them, shared between
  client and server where the same shape is validated twice.
- **Data layer**: pick one and note it here once decided — Drizzle ORM + Postgres,
  Prisma, or a hosted backend (Supabase/Neon). Don't mix ORMs in one project.
- **Auth**: pick one and note it here — Auth.js (NextAuth v5) or Clerk/Supabase Auth.
- **Package manager**: pnpm (fastest installs, strict node_modules). Use whatever the
  lockfile in the repo says — don't introduce a second lockfile.
- **Testing**: Vitest + React Testing Library for units, Playwright for e2e/integration.
- **Lint/format**: ESLint (`next/core-web-vitals`, `next/typescript`) + Prettier, or
  Biome as a single faster replacement for both — don't run both.

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
  db/                      # schema, client, migrations
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
