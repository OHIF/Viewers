---
sidebar_position: 2
sidebar_label: WorkList
title: LegacyWorkList removed
---

# LegacyWorkList removed

3.13 shipped a new study list at `/` and kept the 3.12 one available as
`LegacyWorkList`, selectable through the `workList.variant` customization. Both
are removed in 3.14:

- The `workList.variant` customization no longer exists.
- The `LegacyWorkList` route, its `filtersMeta.js`, and the `LegacyWorkList/`
  directory are deleted.
- The ui-next `WorkList` is always mounted at `/`.

## If you set `workList.variant`

Remove it from your configuration.

```js
// Remove this block — it has no effect in 3.14.
window.config = {
  customizationService: [
    {
      'workList.variant': {
        $set: 'legacy',
      },
    },
  ],
};
```

An unrecognized customization id is ignored rather than reported, so leaving it
in place does not raise an error. It also does not do anything: you get the
ui-next WorkList either way. Removing it keeps your config honest about what is
actually in effect.

## If you imported `LegacyWorkList` directly

The 3.13 guide suggested this import path when the study list was renamed:

```ts
// No longer resolves in 3.14.
import LegacyWorkList from 'path/to/routes/LegacyWorkList/LegacyWorkList';
```

There is no in-tree replacement. If you depend on the 3.12 study list, either
adopt the ui-next `WorkList` and reproduce your changes through the
`workList.*` customizations, or vendor the 3.13 `LegacyWorkList` sources into
your own extension and register it with the `routes.customRoutes`
customization.

The ui-next study list is customizable without forking — columns, the preview
panel, the settings menu, and the row double-click action are all
customization points. Every one of them now applies unconditionally, since
there is no longer a variant that ignores them. See the
[Work List customization docs](../../platform/services/customization-service/WorkList.md).

## Dropped `@ohif/ui` dependency

Removing the legacy route takes the frozen `@ohif/ui` package out of the
application graph, and the stale `@ohif/ui` workspace dependency is dropped
from the packages that no longer import it. `@ohif/ui` still builds and
publishes; nothing in the default app graph imports it. If your own extension
imports from `@ohif/ui`, add it to that package's dependencies explicitly
rather than relying on it being hoisted.
