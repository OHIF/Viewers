---
name: ohif-react-compiler
description: Rules and workflow for editing React code in the OHIF Viewer, which runs React 19 with the React Compiler enabled and two CI gates that fail when a file stops compiling or lint counts move. Use this skill whenever you create or change anything under platform/*/src, extensions/*/src or modes/*/src that contains JSX or a React hook — including small edits, refactors, and requests like "add a useCallback here" — even if the user does not mention React 19, the compiler, or memoization.
---

# OHIF React Compiler

This repo compiles its React with the React Compiler. Most of what that means
is enforced by tooling; this skill tells you how to work with that tooling and
records the decisions already made so you do not relitigate them.

## What is different here

- React 19. `ref` is an ordinary prop. There is no `forwardRef`, no
  `propTypes`, and manual memoization is unnecessary.
- The compiler runs on all workspace source under `platform/`, `extensions/` and
  `modes/`, except the frozen `platform/ui` package and files that carry a
  `'use no memo'` directive at the top.
- Two CI gates hold the current state and fail in **both** directions — when
  things get worse, and when things get better but the budget was not tightened.

| gate              | command                         | budget file                        |
| ----------------- | ------------------------------- | ---------------------------------- |
| compiler coverage | `pnpm run compiler:coverage:ci` | `.react-compiler-budget.json`      |
| compiler lint     | `pnpm run lint:compiler:ci`     | `.react-compiler-lint-budget.json` |

## The loop — after every React edit

1. Lint the file you touched:
   `npx eslint --config eslint.config.mjs --no-config-lookup <file>`
2. `pnpm run compiler:coverage:ci` — did any file start refusing or opt out?
3. `pnpm run lint:compiler:ci` — did the error or warning counts move?
4. If either gate says the counts **improved**, tighten the budget to the exact
   values it prints, in the same commit. Never loosen a budget to make CI pass.

Step 1 is fast and catches most problems. Steps 2 and 3 are what CI runs.

## Hard rules — CI enforces these

- **No `forwardRef`.** Accept `ref` as a regular prop. An ESLint
  `no-restricted-syntax` rule fails on it.
- **No `prop-types`.** Use TypeScript types. An ESLint `no-restricted-imports`
  rule fails on the import.
- **No `eslint-disable` on any `react-hooks/*` rule.** The compiler treats a
  suppression as a `Suppression` bailout and refuses the whole function. Fix the
  code instead.
- **Do not mutate props, and do not read or write `ref.current` during render.**
  Both are refusals (`Immutability`, `Refs`). Compute into a local; move ref
  access into an effect or event handler.
- **No new `'use no memo'` without all three of:** a reproduced failure, a
  comment above the directive saying exactly what broke, and the file added to
  `fileOptOuts` in `.react-compiler-budget.json`. An opt-out is a last resort
  with a paper trail, not a way to make a refusal go away.

## Decisions already made

- **Do not add `useMemo`, `useCallback` or `React.memo`.** The compiler derives
  its own memoization from the code and erases hand-written wrappers from the
  output. Adding one gains nothing and gives the compiler a dependency list it
  has to verify.
- **Removing an existing wrapper: diff the compiled output.** Emit the file
  before and after (see "Reading emitted code"). Identical output means nothing
  to test. If `const $ = _c(n)` disappears from the output, the compiler has
  started refusing — the wrapper was load-bearing; stop and look.
- **A refusal gets fixed, not hidden.** Read the category the gate prints and
  see [references/refusal-categories.md](references/refusal-categories.md) for
  what it means and the usual fix.
- **Public API changes get a migration note** in
  `platform/docs/docs/migration-guide/3p13-to-3p14/`.
- **Components that read or mutate cornerstone3D state during render** are the
  one class that genuinely cannot be compiled yet. That is what the existing
  opt-outs under `extensions/cornerstone/src/Viewport/` are. Do not extend that
  set casually; each one has an issue to remove it.

## Reading the gate output

`compiler:coverage:ci` prints every refusal as file, line, category and reason:

```
extensions/cornerstone/src/components/CinePlayer/CinePlayer.tsx:50
    Todo: (BuildHIR::lowerExpression) Handle ||= operators in AssignmentExpression
```

The line points at the offending expression, not the function. A block titled
"Refusals inside opt-out files" is informational — those files are not being
memoized anyway.

`lint:compiler:ci` printing **"Budget is stale: the counts improved"** is not an
error to work around. It is telling you to write the new numbers into the
budget file.

## Reading emitted code

Use this in two situations only: after fixing a refusal, to confirm the function
now compiles; and before and after removing a `useMemo` or `useCallback`, to see
whether the change altered anything. A new component that passes the gates does
not need it.

To see what the compiler actually produced for a file:

```bash
node .agents/skills/ohif-react-compiler/assets/emit.mjs <file>
```

It compiles that one file with the repo's own babel config, compiler included,
and prints the result. To check whether an edit changed anything the compiler
emits, run it before and after and diff the two outputs — identical output
means identical runtime behaviour, so there is nothing to test.

What to look for: `const $ = _c(n)` means the function compiled; `if ($[i] !== x)`
is a cache guard on input `x`; `t0`, `t1`… are compiler temporaries. A breakpoint
inside a guard fires once and then stops — that is the cache hitting, not a bug.

## Authoritative sources

- [Rules of React](https://react.dev/reference/rules) — what the compiler assumes.
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
  — the compiler's diagnostics as lint rules; this repo uses `recommended-latest`.
- [React Compiler](https://react.dev/learn/react-compiler) — directives, opt-outs.
