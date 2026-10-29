---
name: reverse-engineer
description: Reverse-engineer an existing system — a legacy codebase, a live web page/UI, an undocumented API, or an Oracle schema — into a verified spec, then plan the rebuild in this stack. Use when the user says "reverse engineer", "figure out how X works", "clone/rebuild this page/app", "migrate this legacy app", "document this undocumented API/schema", or hands you a URL/repo/dump and asks what it does.
---

# Reverse Engineer

Turn something that exists but isn't documented into a **spec you can rebuild from**. The output is evidence-backed facts, not a guess at intent — every claim in the spec points at the code line, network capture, DOM node, or query that proves it.

## Scope — ask before starting

Confirm three things, and stop to ask if any is unclear:

1. **Target**: codebase (path/repo), live UI (URL), API (base URL + sample calls), or database (schema/dump). One target per run.
2. **Goal**: *understand* (spec only), *rebuild* (spec + plan in this stack), or *integrate* (spec of the contract only).
3. **Authorization**: the user owns the target or has the right to analyze it. Stay on the public, authenticated-as-the-user surface. **Never** bypass auth, paywalls, rate limits, DRM or obfuscation, decompile licensed binaries, or copy proprietary assets (logos, images, copy, fonts) — extract *structure and behavior*, not content. If authorization is in doubt, ask.

## Redact

Captures carry tokens, cookies and PII. Write `<REDACTED>` in place of every secret before quoting anything, and never commit a raw HAR/cookie jar.

## Phase 1 — Inventory (breadth before depth)

Map the surface before reading any one part deeply. Produce a table: entry point → what it is → where the evidence lives.

| Target | How to inventory |
|--------|------------------|
| Codebase | `package.json`/lockfile (stack + deps), route/page files, API handlers, DB access layer, env vars read (`grep -rn "process.env"`), cron/queue entry points. |
| Live UI | Playwright: visit each route, save `page.content()`, screenshot at 375/768/1440px, list network requests (`page.on('request')`). Sitemap / nav links give the route list. |
| API | Captured requests (HAR or Playwright), OpenAPI/GraphQL introspection if exposed, status codes and error shapes per endpoint. |
| Oracle schema | `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`/`USER_CONS_COLUMNS` (PK/FK), `USER_INDEXES`, `USER_SEQUENCES`, `USER_TRIGGERS`, `USER_SOURCE` (PL/SQL). Read-only queries only. |

## Phase 2 — Trace one vertical slice

Pick the most important user flow and follow it end to end: UI event → request → handler → query → response → render. Write down each hop with its evidence. Only after one slice is fully traced, repeat for the next. Skipping this produces a spec of nouns with no verbs.

For a **UI target**, also extract the design layer per page: layout grid and breakpoints, spacing scale, type scale (family, sizes, weights, line-heights), color tokens (`getComputedStyle` on representative elements), radius/shadow, component inventory (button/input/card variants and their states: hover, focus, disabled, loading, error, empty). Hand these to the `ui-ux-pro-max` skill to normalize into a design system rather than copying raw values.

## Phase 3 — Verify every claim

A claim is verified only when you can re-observe it:

- **Code claim** → cite `path:line`.
- **Behavior claim** → a characterization test (Vitest/Playwright) or a repeatable request that shows it. For rebuilds, these become the acceptance tests for the new code.
- **Data claim** → the query and its (redacted) result.

Mark anything you could not verify as `UNVERIFIED` with what would verify it. Never fill gaps with what the system "probably" does.

## Phase 4 — Write the spec

Save to `docs/reverse-engineering/<target-slug>.md`:

```markdown
# <Target> — reverse-engineered spec
Source: <repo@commit | URL + date captured | schema owner>   Goal: <understand|rebuild|integrate>

## Inventory          — table from Phase 1
## Flows              — one section per traced slice: hop → evidence
## Data model         — entities, keys, relationships, constraints, invariants
## Contracts          — endpoints / actions: input, output, errors, auth
## Design system      — tokens + component states (UI targets only)
## Quirks & bugs      — surprising behavior, kept or dropped deliberately
## Unverified         — open questions + how to verify each
```

## Phase 5 — Rebuild plan (goal = rebuild only)

Map each spec item onto this repo's conventions in `CLAUDE.md`:

- Pages/flows → `new-page` / `new-component`; mutations → `new-server-action`; external callers/webhooks → `new-api-route`.
- Data model → numbered Oracle migrations in `lib/db/migrations/` (uppercase identifiers, `VARCHAR2`, bind variables), typed queries in `lib/db/queries/`.
- Characterization tests from Phase 3 → the `tdd` red list.
- Order the plan as vertical slices, each with its verify step. Run `grilling` on the plan before building.

Do not start rebuilding in the same run unless the user asks.
