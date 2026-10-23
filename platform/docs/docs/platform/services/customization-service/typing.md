---
sidebar_label: Typing Customizations
title: Typing Customizations
summary: How to declare the TypeScript type of a customization id in the AppTypes.Customizations registry so that reads are typed, writes are checked, and casts can be deleted.
sidebar_position: 12
---

By default `getCustomization(id)` accepts any string and returns the loose
`Customization` union, so call sites cast (`as string`, `as unknown as
ColorbarCustomization`, ...) and `setCustomizations` payloads are not checked at
all.

You can opt a customization id into real typing by declaring it in the
`AppTypes.Customizations` registry. Declaring an id gives you:

- **autocomplete** for the id itself,
- a **precise return type** from `getCustomization` / `getValue`, so the cast at
  the call site can be deleted,
- **checked writes** — `setCustomizations` validates the value against the
  declared type, including `$set` / `$push` / `$merge` specs.

Ids you do not declare keep working exactly as before. Nothing here changes
runtime behavior.

## Declaring a key

The registry is a global interface extended by declaration merging, the same
pattern already used for `AppTypes.Services`. Add a `types/AppTypes.ts` to your
package (or extend the existing one) and merge in the ids you own:

```ts
// platform/ui-next/src/types/AppTypes.ts
declare global {
  namespace AppTypes {
    interface Customizations {
      /**
       * Sort options offered by the study browser's sort dropdown. Read by
       * `StudyBrowserSort`, which indexes `[0]` for its initial selection, so a
       * default with at least one entry is expected.
       */
      'studyBrowser.sortFunctions': Array<{
        label: string;
        sortFunction: (a: AppTypes.DisplaySet, b: AppTypes.DisplaySet) => number;
      }>;
    }
  }
}

export {};
```

That is the whole mechanism. `StudyBrowserSort` now reads the value without a
cast and without `?.`:

```tsx
const sortFunctions = customizationService.getCustomization('studyBrowser.sortFunctions');

const [selectedSort, setSelectedSort] = useState(sortFunctions[0]);
// ...
{sortFunctions.map(sort => <DropdownMenuItem key={sort.label}>{sort.label}</DropdownMenuItem>)}
```

For a value type of any real size, export it from the file that produces the
default and reference it here rather than inlining the shape.

## Where to declare it

**The package that consumes a key declares its type**, next to the consumer.

That is often also the package registering the default, but not always, and the
difference matters. `studyBrowser.sortFunctions` above is declared in
`platform/ui-next` because that is where it is read — but its default is
registered by `extension-default`
(`src/customizations/studyBrowserCustomization.ts`). Declaring at the consumer is
what lets the provider's default be checked against the contract the consumer
relies on.

Keys read by `platform/core` are declared in core, so the dependency direction
stays extension-free:

```ts
// platform/core/src/types/AppTypes.ts, inside the existing
// `declare global { namespace AppTypes { ... } }` block
export interface Customizations {
  /**
   * Orders display sets within a study. Consumed by `createStudyBrowserTabs`
   * here in core and by the viewer's `defaultRouteInit`; the default is
   * registered by `extension-default`.
   */
  sortingCriteria: (a: DisplaySet, b: DisplaySet) => number;

  /** Orders the instances of an image set. Consumed by `ImageSet.sort`. */
  instanceSortingCriteria: {
    defaultSortFunctionName?: string;
    sortFunctions?: Record<string, (a: unknown, b: unknown) => number>;
  };
}
```

Declaring `sortingCriteria` is what let this cast be deleted in *two* packages
(`platform/core/src/utils/createStudyBrowserTabs.ts` and
`platform/app/src/routes/Mode/defaultRouteInit.ts`), which had the same one:

```diff
- const sortCriteria = customizationService.getCustomization('sortingCriteria') as (a, b) => number;
+ const sortCriteria = customizationService.getCustomization('sortingCriteria');
```

Third-party extensions declare their own ids the same way, from outside the
repo. Nothing needs to be registered centrally.

## Declare the *resolved* value

The declared type describes what `getCustomization` hands back — the value
**after** `inheritsFrom` merging, `$transform`, and `$reference` expansion have
run. It is not the shape you write.

This distinction is what lets composition keys be typed at all. `toolbarButtons`
resolves to a list of buttons, so that is what you declare:

```ts
interface Customizations {
  toolbarButtons: Button[];
}
```

...even though it is almost always *written* with `$reference` markers:

```js
// modes/basic/src/index.tsx
toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }],
```

Both are accepted. `setCustomizations` allows the read-time markers wherever the
resolver walks — as a whole value, as an array item, or as a plain object's
property value — while reads stay clean:

```ts
customizationService.setCustomizations({
  // whole value
  toolbarButtons: { $reference: 'cornerstone.toolbarButtons' },
  // appended to the existing list
  toolbarSections: { $push: [{ $reference: 'cornerstone.toolbarSections' }] },
  // mixed with literal entries
  toolGroupAdditions: { default: [{ $reference: 'x' }], mpr: [] },
  // computed at read time from its siblings (must be a `function`, not an
  // arrow -- `$transform` reads the sibling properties off `this`)
  measurementsContextMenu: {
    inheritsFrom: 'ohif.contextMenu',
    $transform: function (customizationService) {
      return { ...this, menus: this.menus.map(menu => ({ ...menu })) };
    },
  },
});
```

Do **not** put markers into the declared type. `toolbarButtons: (Button |
ReferenceMarker)[]` would force every read site to handle a marker that
`getCustomization` never returns.

## Nullability

**A declaration without `| undefined` is a promise that a default is
registered.** Consumers may then use the value directly, which is how existing
consumers are already written — `StudyBrowserSort` indexes `sortFunctions[0]`
with no guard.

Add `| undefined` only for ids that genuinely ship no default:

```ts
interface Customizations {
  // has a default registered by extension-default
  'studyBrowser.sortFunctions': SortFunction[];
  // no default; every consumer must handle absence
  'studyBrowser.onDoubleClick': DoubleClickHandler | undefined;
}
```

Note the repo's own `tsconfig.json` does not enable `strictNullChecks`, so
`| undefined` is erased in-tree; it is a contract for downstream consumers that
do compile strictly.

## Declaring a custom update command

`$filter` is registered by the service itself. If your extension registers more
through `registerCustomUpdateCommand`, declare them in the parallel
`AppTypes.CustomizationUpdateCommands` registry so specs using them type-check
without a cast:

```ts
declare global {
  namespace AppTypes {
    interface CustomizationUpdateCommands {
      /** Reorders toolbar entries by weight. */
      $reweight: { id: string; weight: number };
    }
  }
}
```

```ts
customizationService.registerCustomUpdateCommand('reweight', (query, original) => ...);
customizationService.setCustomizations({
  toolbarButtons: { $reweight: { id: 'Zoom', weight: 3 } },
});
```

## Gotchas

**A key of type `any` disables all checking.** If the id you pass is `any` — for
example destructured out of an untyped props bag — the call returns `any`, which
is *weaker* than the `Customization | undefined` an undeclared id gets.
Annotate the key as `string`:

```ts
// items: any -- no checking at all
export default function MoreDropdownMenu(bindProps) {
  const { menuItemsKey } = bindProps;
  const items = customizationService.getCustomization(menuItemsKey);

// items: Customization | undefined -- correct fallback
export default function MoreDropdownMenu(bindProps) {
  const { menuItemsKey }: { menuItemsKey: string } = bindProps;
  const items = customizationService.getCustomization(menuItemsKey);
```

**Typos in a declared id are not caught.** Because undeclared ids must keep
working, `setCustomizations` accepts any string key, so
`'panelSegmentation.disabledEditing'` is silently treated as an unregistered
dynamic key rather than reported as a misspelling of a declared one.

**`$transform`'s return type is not checked** — it is validated as a function,
but not against the declared value type.

**`getValue`'s fallback is not checked.** Passing a `fallbackValue` whose type
does not match the declaration does not error; the call resolves to the loose
signature and returns the fallback's type. Prefer `getCustomization` for
declared ids.

## See also

- [Advanced Customization](./advanced.md) — `inheritsFrom` and `$transform`
  semantics.
- [Customization Service](./customizationService.md) — the `$set` / `$push` /
  `$filter` command syntax these types check.
