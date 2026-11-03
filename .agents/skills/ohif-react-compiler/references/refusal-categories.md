# Refusal categories

When the React Compiler will not memoize a function it emits it unchanged and
reports a category and a reason. `pnpm run compiler:coverage:ci` prints both,
with the line of the offending expression. The reason string is the compiler's
own and is authoritative; this file explains what each category usually means
in this codebase and how it has been fixed before.

## Sources

- **The category names are the compiler's own.** This file covers the nine this
  codebase has produced; the compiler defines more, and the gate prints
  whichever one it hits.
- **Lint rule names and which are enabled:**
  [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks).
  This repo uses the `recommended-latest` preset, which leaves some of the
  plugin's rules off. Every rule named below was checked against the installed
  plugin.
- **How to read a diagnostic:**
  [React Compiler docs](https://react.dev/learn/react-compiler) and the
  [Rules of React](https://react.dev/reference/rules) the compiler assumes.
- **The "how it has been fixed" guidance** comes from fixes made in this repo
  during the React 19 migration, not from documentation. `Hooks`, `Globals` and
  `UseMemo` were cleared early in that work, so their fix guidance is briefer
  and less tested than the others'.

Two things to know first:

- **A function reports one category at a time.** Fixing it often exposes a
  different one underneath. Recompile after every fix and expect a second
  round.
- **Most categories have no lint rule that fires here.** `PreserveManualMemo`
  in particular has a rule enabled as an error that has never once fired on a
  real case. Only compiling finds these — which is why the coverage gate exists.

## Immutability

*"This value cannot be modified"*, *"Cannot access variable before it is
declared"*.

Something is being written to that the compiler needs to treat as read-only:
a prop, a value captured by a closure, or a variable referenced before its
declaration in a circular pair of callbacks.

Fix by computing into a new local instead of assigning into the existing
object, and by breaking circular references between callbacks (for example an
`AbortController` for listener teardown rather than each handler naming the
other). Check every downstream reader before changing a mutation — today they
observe the mutated object.

Lint: `react-hooks/immutability` reports some but not all of these.

## Refs

*"Cannot access refs during render"*.

`ref.current` is read or written in the render body rather than in an effect or
an event handler. The compiler cannot cache across a value it cannot see change.

Fix by moving the access into a `useEffect` or a handler. Where a ref is used to
carry identity across renders synchronously — "reset X when Y changed, before
anything renders" — the fix is a design change, not a mechanical one. See the
`Mode.tsx` issue for a case where the recommendation is to leave it.

Lint: `react-hooks/refs`.

## PreserveManualMemo

*"Existing memoization could not be preserved"*.

A hand-written `useMemo` or `useCallback` has a dependency list narrower than
what its body actually reads. The compiler infers the real dependencies, finds
they differ from what was written, and refuses the whole function rather than
silently change behaviour.

Fix by completing the dependency list, or by deleting the wrapper. In a
compiled file deleting is usually safe — the compiler re-derives the
memoization — but diff the compiled output before and after to be sure.

Lint: `react-hooks/preserve-manual-memoization` is enabled and has never fired
on a real instance here. Do not rely on it.

## Suppression

An `eslint-disable` comment for a `react-hooks/*` rule is present in the
function. The compiler treats the suppression as a signal that the code
knowingly breaks a rule, and refuses.

Fix by removing the disable comment and fixing what it was hiding — usually an
incomplete dependency list.

Lint: `react-hooks/rule-suppression` exists but is not in the preset this repo
uses.

## RenderSetState

A state setter is called during render rather than in an effect or handler.

Fix by deriving the value instead of storing it, or by moving the call to where
it belongs. If the setter is guarded so it only fires on a real change, restate
that as derived state.

Lint: `react-hooks/set-state-in-render`.

## Hooks

A hook is called conditionally, in a loop, or after an early return, so the
compiler cannot establish a fixed hook order.

Fix by moving every hook above the first `return` and out of any branch. This
is the same rule `rules-of-hooks` enforces, and it has always applied.

Lint: `react-hooks/rules-of-hooks`; the compiler-specific rule
`react-hooks/hooks` exists but is not in the preset.

## Globals

A module-scope value is mutated during render.

Fix by moving the mutation into an effect or handler, or by lifting the value
into state or context so React owns it.

Lint: `react-hooks/globals`.

## UseMemo

`useMemo` is called in a shape the compiler will not handle — for example with
something other than a plain function as its first argument.

Fix per the reason string; usually the wrapper can simply be removed.

Lint: `react-hooks/use-memo`.

## Todo

*"(BuildHIR::lowerExpression) Handle …"*.

Not a problem with your code. The compiler's front end has not implemented a
syntax form you used. The one instance in this codebase is a logical assignment
operator, `||=`.

Fix by rewriting the construct longhand (`x = x || y`). This category shrinks
with each compiler release.

Lint: `react-hooks/todo` reports these verbatim but is not in the preset.

## Which lint rules are actually on

This repo uses `eslint-plugin-react-hooks` `recommended-latest`, which does not
enable every rule the plugin ships. The ones that would report `Todo`,
`Suppression`, and the compiler-specific `hooks` are off. So the linter being
clean does not mean the compiler is happy; only the coverage gate tells you that.
