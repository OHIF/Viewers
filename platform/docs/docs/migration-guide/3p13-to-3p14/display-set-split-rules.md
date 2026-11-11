---
sidebar_position: 15
sidebar_label: Display set split rules
title: Display set split rules and SOP class handlers
summary: What an extension with a SOP class handler must add so that its display sets work when a deployment turns on the display set split rules.
---

# Display set split rules and SOP class handlers

3.14 adds the display set split rules of `@cornerstonejs/metadata`, as an opt-in
customization (`useMetadataDisplaySet`). The rules are **off by default**. With
the rules off, nothing in this page applies, and every SOP class handler runs as
in 3.13.

This page is for the author of an extension that has a SOP class handler. It
states what changes when a deployment turns the rules on, for example with
`?customization=split/enableNewSplit`.

| Change | Kind |
|---|---|
| With the rules on, a SOP class handler of another extension does not run | Breaking, only with the rules on |
| A SOP class handler can declare `handlerNames` and `extendDisplaySet` | New, optional |

## What the user sees

With the rules on, the rules decide the display sets of each series. Each rule
can name a handler. A SOP class handler serves the display sets of the names
that it declares.

- The SOP class handlers of the OHIF extensions declare their names, so SEG,
  RTSTRUCT, parametric maps, SR, PDF, video, ECG, whole slide and microscopy
  display sets show as with the rules off.
- The default `unsupported` rule takes each instance that no other rule takes.
  So a series of a private SOP class shows as an **unsupported display set**,
  also when the mode has a SOP class handler for that class.
- With the rules off, the same series shows with the handler of the extension.

## What an extension adds

To serve a SOP class with the rules on, add two things.

**1. A handler name and `extendDisplaySet` on the SOP class handler.**

**Before (3.13)**, the handler builds the display sets from a series:

```js
{
  name: 'my-private-object',
  sopClassUids: ['1.2.3.4.5'],
  getDisplaySetsFromSeries,
}
```

**After (3.14)**, the handler also declares a name, and a function that adds its
fields to a display set that a rule made. Keep `getDisplaySetsFromSeries` for the
rules off. Use the same code in both paths:

```js
{
  name: 'my-private-object',
  sopClassUids: ['1.2.3.4.5'],
  getDisplaySetsFromSeries,
  handlerNames: ['myPrivateObject'],
  extendDisplaySet: (displaySet, { addedInstances, servicesManager, extensionManager }) => {
    // Add the fields of the handler to displaySet, in place and synchronously.
    // addedInstances is undefined at creation, and lists the new instances at an update.
  },
}
```

A handler that declares `handlerNames` and has no `extendDisplaySet` is an error
when the mode starts.

**2. A rule that claims the SOP class and names the handler.** Give the rule a
priority below 0, so that it runs before the default rules:

```js
customizationService.setCustomizations({
  useMetadataDisplaySet: {
    splitRules: {
      $merge: {
        myPrivateObject: {
          priority: -1,
          description: 'My private SOP class: one display set for each instance.',
          handler: 'myPrivateObject',
          matches: { SOPClassUID: '1.2.3.4.5' },
          groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
        },
      },
    },
  },
});
```

A server that builds the same display sets reads the same rule, so put the rule
in a customization file, and not only in code.

## More information

- [Display Set Splitting](../../platform/services/customization-service/displaySetSplitting.md),
  section "Handlers: `handlerNames` and `extendDisplaySet`".
- The user requirements `SP-FIX-9` and `SP-FIX-10` in the
  [display set splitting specification](../../development/specs/display-set-splitting/requirements.md).
