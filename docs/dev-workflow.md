# Dev workflow — feature lifecycle in this repo

The practical flow for full-stack work here (Next.js + Oracle), from idea to ship,
and which skill fires at each step. Skills marked `/name` are user-invoked slash
commands; the rest Claude picks up on its own when the situation matches.

Quick version: **`/grill-me` before anything big → let Claude run the gates →
`/code-review` before merge.** Everything else below is invoked as the situation
calls for it.

## 1. Before writing code — think first

- Non-trivial feature → `/grill-me`: rounds of questions until the plan holds up.
  (Claude may invoke `grilling` itself when a plan looks loose.)
- Need external docs/API facts → `research`: runs as a background agent, findings
  land as a cited Markdown file while you keep working.
- Unsure a state model or UI shape is right → `prototype`: throwaway code that
  answers the question, never merged.
- Deciding where an interface or seam goes → `codebase-design`.

## 2. Build — scaffold the shell, test-drive the logic

- Scaffold with `new-page` / `new-component` / `new-server-action` / `new-api-route`
  (the last one only for webhooks/external APIs — normal mutations are Server Actions).
- DB side: new migration file in `lib/db/migrations/` (forward-only) + query
  functions in `lib/db/queries/` (bind variables, typed rows).
- Logic with a clear seam → `tdd` (red → green).

## 3. When a bug shows up

- Hard bug → `diagnosing-bugs`: build a repro before hypothesizing.
- Fixed and validated → `/post-mortem`: record root cause, mechanism, validation,
  and why it slipped through, in `docs/postmortems/`.

## 4. Before calling it done — gates, in order

```
tsc --noEmit → lint → vitest → next build
```

User-facing features need at least one Playwright happy-path test. Claude runs
these before reporting done (repo operating rule 1).

## 5. Review and ship

- `/code-review` for bugs, `/simplify` for excess code, `/security-review` before
  merging a significant branch.
- Conventional commits (`feat:` / `fix:` / …). Migrations ship before the code
  that depends on them. Claude never pushes or deploys unasked.

## 6. Long sessions

- Stopping or switching machines → `/handoff`: compacts the conversation into a
  handoff document for the next session.
