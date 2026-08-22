---
id: index
sidebar_position: 1
sidebar_label: 3.13 -> 3.14
title: 3.13 to 3.14 Migration Guide
---

import DocCardList from '@theme/DocCardList';

# 3.13 to 3.14 Migration Guide

This guide covers changes when upgrading from OHIF version 3.13 to version 3.14.

- **[React 19](./react-19.md)** — the monorepo moves to **React 19.2.7**.
  `@ohif/ui-next` now declares react/react-dom as `peerDependencies`, so
  consuming applications must supply React 19, and extensions and modes require
  it too.
- **[SmartScrollbar](./smart-scrollbar.md)** — `SmartScrollbarFill` and
  `SmartScrollbarEndpoints` now require the `marked` array to change identity when
  its contents change. The `version` prop is deprecated and no longer invalidates.
- **[WorkList](./work-list.md)** — the `LegacyWorkList` route and the
  `workList.variant` customization are removed. The ui-next `WorkList` is now
  always mounted at `/`, and the legacy `@ohif/ui` package leaves the app graph
  with it.
- **[DataTable / TanStack Table v9](./data-table.md)** — `@ohif/ui-next` upgrades
  `@tanstack/react-table` to v9. Column definitions need the `DataTableFeatures`
  generic and the `sortFn` rename; programmatic visibility toggles should go
  through `useToggleColumnVisibility`.

<DocCardList />
