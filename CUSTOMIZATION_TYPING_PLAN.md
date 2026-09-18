# Typed Customizations: Design and Rollout Plan

This document accompanies the PR that introduces the `AppTypes.Customizations`
registry and describes the follow-up work needed to make every customization id
in OHIF fully typed and discoverable.

User-facing instructions for declaring keys live in the docs:
[Typing Customizations](platform/docs/docs/platform/services/customization-service/typing.md).
This file is the design rationale and the rollout tracker.

## Problem

`customizationService.getCustomization(id)` accepts any string and returns the
`Customization` union, which is broad enough to be effectively untyped. As a
result:

- There is no way to discover which customization ids exist from the code; the
  docs table (`platform/docs/docs/platform/services/customization-service/sampleCustomizations.tsx`)
  is hand-maintained and already drifts from the registered keys.
- Consumers cast at the call site (`as unknown as ColorbarCustomization`,
  `as string`, `as any`, ...) — roughly 20 such casts exist across the repo.
- `setCustomizations` payloads (including `$set` / `$push` / `$merge` command
  specs used by modes and app config) are not checked at all.

## Design (implemented in this PR)

A declaration-merged registry, following the same pattern already used for
`AppTypes.Services` and `PresentationIds`:

1. `platform/core/src/types/AppTypes.ts` seeds the global interface.

2. Each package (in-tree or third-party) merges the keys it owns:

   ```ts
   declare global {
     namespace AppTypes {
       interface Customizations {
         'viewportOverlay.topLeft': OverlayItem[];
         'panelSegmentation.disableEditing': boolean;
       }
     }
   }
   ```

3. The service API is overloaded so registered ids get autocomplete and precise
   types, while unregistered ids (dynamic keys such as
   `` `${buttonSectionId}.config` ``, third-party keys that have not been
   declared) keep working through a plain-string fallback:

   - `getCustomization('viewportOverlay.topLeft')` returns `OverlayItem[]`.
   - `getCustomization('some.dynamic.key')` returns `Customization | undefined`
     exactly as before.
   - `setCustomizations({...})` checks registered ids against their declared
     value type, either as a direct value or as an immutability-helper spec
     (`{ $set: ... }`, `{ $push: [...] }`, the custom `$filter`, ...), via the
     `CustomizationEntries` type in
     `platform/core/src/services/CustomizationService/types.ts`.
   - `CustomizationPhaseInput` (the `bootstrap` / `global` / `mode` blocks of
     `appConfig.customizationService`) reuses `CustomizationEntries`, so
     phase-tagged config written in TypeScript is checked the same way.

Nothing about the runtime changes; this is purely additive typing.

### Read-time markers are a write-side concern

`$reference` and `$transform` are read-time markers, not update commands: the
service substitutes/invokes them when a value is *read* (`_resolveReferences`,
`transform`), and `hasDollarKey` deliberately exempts them from the
immutability-helper path. A value may therefore be *authored* with a marker
standing in wherever the resolver walks — as a whole value, as an array item (a
referenced array is flattened into the surrounding list), or as a plain object's
property value — while the value that comes back out of `getCustomization` never
contains one.

`Authorable<T>` in `types.ts` encodes exactly that, mirroring the resolver's
walk: it recurses through arrays and plain objects and stops at the things
`_resolveReferences` returns untouched (functions, constructors, React elements,
`Date`, `RegExp`).

The important structural decision is that `Authorable<T>` is applied **only** on
the write side, in `CustomizationEntries`. The registry declares what a key
*resolves to*, so `getCustomization`'s return type stays clean. Declaring marker
unions in the registry instead — the other obvious option — would push
`{ $reference }` into the type of every read site, which is both wrong and
unusable.

Without this, the highest-value keys could not be typed at all:
`toolbarButtons`, `toolbarSections` and `toolGroupAdditions` are composed
*exclusively* through `{ $reference }` markers.

### Custom update commands are a registry too

`$filter` is registered by the service itself; extensions can add more at
runtime through `registerCustomUpdateCommand`. Those are declared the same way
customization ids are, via `AppTypes.CustomizationUpdateCommands`, so a spec
using a third-party command type-checks without a cast.

One non-obvious constraint, worth not re-discovering: `Spec` surfaces custom
commands through `C extends CustomCommands<infer O> ? O : never`, and `O` infers
to the **whole** registry interface. The projection must therefore be
`CustomCommands<Partial<...>>`. Without `Partial`, every spec would have to
supply *all* registered commands at once, and a registry holding more than one
command rejects a plain `{ $filter: ... }` outright with a misleading error. The
single-command form this PR started with only worked because there was exactly
one command.

### Conventions for declaring keys

- **The package that consumes a key declares its type**, next to that consumer.
  This is usually also the package that registers the default, but not always —
  see `studyBrowser.sortFunctions`, consumed by `platform/ui-next` and defaulted
  by `extension-default`. Declaring at the consumer is what lets the provider's
  default be checked against the contract.
- Keys consumed by `platform/core` or `platform/ui-next` but defaulted in
  `extension-default` (`sortingCriteria`, `instanceSortingCriteria`,
  `studyBrowser.sortFunctions`) are declared in core/ui-next so the dependency
  direction stays extension-free.
- Declared types describe the resolved value after `inheritsFrom` /
  `$transform`, i.e. what `getCustomization` actually returns — not what may be
  written for the key.
- **A declaration without `| undefined` is a promise that a default is
  registered.** Consumers may read it and use the value directly; that is how
  existing consumers are already written (`StudyBrowserSort` indexes `[0]` with
  no guard). Add `| undefined` only for keys that genuinely ship no default.

  The residual risk is deliberate and worth stating: the promise is made by the
  declaring package but kept by whichever package registers the default, so a
  deployment whose `pluginConfig.json` omits that provider gets `undefined`
  where the type says otherwise. That is already a runtime failure today, so the
  type does not make it worse — but the invariant lives in convention rather
  than in the compiler until the Phase 4 check below exists.

## Known limitations

These are accepted trade-offs of the fallback design, not bugs to fix. They are
listed so reviewers and adopters do not have to rediscover them.

- **`any`-typed keys degrade to `any`.** Once the registry is non-empty,
  `getCustomization(k)` where `k` is `any` (e.g. destructured from an untyped
  props bag) selects the generic overload and returns `any`, so *all* checking
  at that call site is lost — including the `Customization | undefined` it used
  to get. This is inherent to making the method generic over the key; the
  single-signature conditional-return form does not avoid it. The fix is at the
  call site: annotate the key as `string`. Two such sites exist today
  (`MoreDropdownMenu`, `DataSourceConfigurationComponent`) and are Phase 2 work.
- **Typos in registered ids pass silently.** The `[customizationId: string]:
  unknown` fallback in `CustomizationEntries` disables excess-property checking,
  so `'panelSegmentation.disabledEditing'` is accepted as an unregistered
  dynamic key. Unavoidable while undeclared ids must keep working.
- **`getValue`'s fallback is not checked.** A wrong-typed `fallbackValue` on a
  registered id falls through to the loose string overload and returns that
  wrong type rather than erroring. Overload fallthrough; would need
  `getValue` restructured into with-/without-fallback overloads.
- **`$transform`'s return type is not checked.** `Spec` already admits a bare
  `(value: T) => T` form, so a `$transform` is validated as a function but not
  against `T`. Acceptable for a dynamic escape hatch whose `this` is untyped.

## Next steps

### Phase 1 (this PR): infrastructure + a cross-package proof

Beyond the types themselves, three keys are declared so the mechanism is
exercised in-tree rather than only in a scratch project, and so Phase 2 has a
copyable reference:

- `platform/core/src/types/AppTypes.ts` — `sortingCriteria`,
  `instanceSortingCriteria`.
- `platform/ui-next/src/types/AppTypes.ts` — `studyBrowser.sortFunctions`.

Together these prove the declaration crosses package boundaries in both
directions: `sortingCriteria` is declared in core, defaulted in
`extension-default`, and consumed in core *and* `platform/app` (deleting the
identical cast in both); `studyBrowser.sortFunctions` is declared and consumed
in `ui-next` while being defaulted in `extension-default`.

### Phase 2: populate the registry for extension-default and extension-cornerstone

The bulk of the value: these two extensions register roughly 75 of the ~90
known ids. For each key:

1. Export its value type from the producer file (most already have local
   interfaces or obvious shapes).
2. Add the entry to the extension's `types/AppTypes.ts` augmentation.
3. Remove the now-redundant casts at consumer call sites; each removed cast is
   a free correctness check.
4. Annotate any dynamic key feeding `getCustomization` as `string` rather than
   leaving it `any` — otherwise declaring keys silently converts those sites to
   `any` (see Known limitations).

Suggested PR split: one PR per extension.

### Phase 3: remaining extensions

- `cornerstone-dicom-seg` (`segmentation.store.*`, `segmentation.segmentLabel`,
  `cornerstone.segmentation.loadMultiframeAsPart10`), `cornerstone-dicom-sr`
  (`onBeforeSRAddMeasurement`, `onBeforeDicomStore`, `codingValues`, ...),
  `cornerstone-dicom-rt`, `cornerstone-dicom-pmap`, `dicom-microscopy`,
  `measurement-tracking` (`measurement.prompt*`, `viewportNotification.*`),
  `cornerstone-dynamic-volume`.
- Modes' `setCustomizations` calls in `onModeEnter` become checked
  automatically once the keys they touch are declared.

### Phase 4 (optional follow-ups)

- Add a committed compile-time test (`// @ts-expect-error` assertions, or
  `tsd` / `expectTypeOf`) run by a script. The mechanism is purely
  compile-time, so the unit tests cover none of it and the repo has no tsc CI
  gate — without this it can regress silently. The `Partial` constraint above
  is exactly the kind of thing such a test pins down.
- Generate the docs customization table from the registry instead of the
  hand-maintained `sampleCustomizations.tsx`, so docs cannot drift.
- Reuse that same enumeration to assert every id declared **without**
  `| undefined` actually has a default registered after `init()`. That closes
  the residual risk in the nullability convention above, and does so by
  catching the real failure (a missing default) rather than taxing every read
  site with `?.`.
- Generate a JSON Schema from `AppTypes.Customizations` to give editor
  IntelliSense and validation for the JSONC `?customization=` files and the
  `customizationService` section of config files.
- Consider a lint rule nudging away from `getValue`-with-cast toward the typed
  `getCustomization` overload.

## Verification recipe used for this PR

- `npx jest platform/core/src/services/CustomizationService` — 79 tests across
  7 suites pass.
- Full-repo `npx tsc --noEmit --emitDeclarationOnly false -p tsconfig.json`
  diffed against a pre-change baseline: 3341 -> 3337 errors, **zero new**.
  (The repo has thousands of pre-existing tsc errors and no tsc CI gate;
  diffing sorted error lists is the only reliable check.)

  Of the four that cleared, two are genuine wins from the declared keys
  (`StudyBrowserSort` losing `Property 'map' does not exist on type
  'Customization'`, and `CustomizationService.transform`). The other two
  (`MoreDropdownMenu`, `DataSourceConfigurationComponent`) are **not** wins —
  they are the `any`-key degradation described under Known limitations, i.e.
  checks being switched off rather than satisfied. Counting them as fixes would
  be misleading.
- A standalone compile-time smoke test exercised the mechanism end to end under
  both the repo's compiler settings and `--strict`: registry augmentation from
  another package, typed reads, direct values, `$set` / `$push` element
  checking, `$filter`, a declaration-merged third-party command, all four
  `$reference` marker positions, `$transform`, and the plain-string fallback —
  each paired with a negative case asserting the wrong shape is still rejected.
