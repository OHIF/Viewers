# Typed Customizations: Design and Rollout Plan

This document accompanies the PR that introduces the `AppTypes.Customizations`
registry and describes the follow-up work needed to make every customization id
in OHIF fully typed and discoverable.

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

1. `platform/core/src/types/AppTypes.ts` seeds an empty global interface:

   ```ts
   declare global {
     namespace AppTypes {
       export interface Customizations {}
     }
   }
   ```

2. Each extension (in-tree or third-party) merges the keys it owns:

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

### Conventions for declaring keys

- The extension that registers a key's default owns its type declaration.
  Export the value type from the `*Customization.ts` file that produces the
  default, and add the registry entry in the extension's `types/AppTypes.ts`.
- Declare a key with `| undefined` when no default is shipped for it, so strict
  consumers must handle its absence. (Note: the repo's own tsconfig does not
  enable `strictNullChecks`, so this protects downstream strict consumers.)
- Declared types describe the resolved value after `inheritsFrom` /
  `transform`, i.e. what `getCustomization` actually returns.

## Next steps

### Phase 2: populate the registry for extension-default and extension-cornerstone

The bulk of the value: these two extensions register roughly 75 of the ~90
known ids. For each key:

1. Export its value type from the producer file (most already have local
   interfaces or obvious shapes).
2. Add the entry to the extension's `types/AppTypes.ts` augmentation.
3. Remove the now-redundant casts at consumer call sites; each removed cast is
   a free correctness check.

Suggested PR split: one PR per extension.

### Phase 3: remaining extensions and the core-owned keys

- `cornerstone-dicom-seg` (`segmentation.store.*`, `segmentation.segmentLabel`,
  `cornerstone.segmentation.loadMultiframeAsPart10`), `cornerstone-dicom-sr`
  (`onBeforeSRAddMeasurement`, `onBeforeDicomStore`, `codingValues`, ...),
  `cornerstone-dicom-rt`, `cornerstone-dicom-pmap`, `dicom-microscopy`,
  `measurement-tracking` (`measurement.prompt*`, `viewportNotification.*`),
  `cornerstone-dynamic-volume`.
- Keys consumed by `platform/core` / `platform/ui-next` but defaulted in
  `extension-default` (`instanceSortingCriteria`, `sortingCriteria`,
  `studyBrowser.sortFunctions`) must be declared in `platform/core` itself so
  the dependency direction stays core -> extension-free; `extension-default`
  imports those types from core.
- Modes' `setCustomizations` calls in `onModeEnter` become checked
  automatically once the keys they touch are declared.

### Phase 4 (optional follow-ups)

- Generate the docs customization table from the registry instead of the
  hand-maintained `sampleCustomizations.tsx`, so docs cannot drift.
- Generate a JSON Schema from `AppTypes.Customizations` to give editor
  IntelliSense and validation for the JSONC `?customization=` files and the
  `customizationService` section of config files.
- Consider a lint rule nudging away from `getValue`-with-cast toward the typed
  `getCustomization` overload.

## Verification recipe used for this PR

- `pnpm --filter @ohif/core exec jest src/services/CustomizationService` — all
  68 unit tests pass.
- Full-repo `npx tsc --noEmit --emitDeclarationOnly false -p tsconfig.json`
  diffed against a pre-change baseline: three pre-existing false positives
  fixed, zero new errors. (The repo has ~5.7k pre-existing tsc errors and no
  tsc CI gate; diffing sorted error lists is the reliable check.)
- A standalone compile-time smoke test exercised the mechanism end to end
  (registry augmentation, typed reads, spec checking, string fallback) under
  both the repo's compiler settings and `--strict`.
