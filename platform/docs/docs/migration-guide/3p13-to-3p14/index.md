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
- **[WorkList](./work-list.md)** — `LegacyWorkList` and the `workList.variant`
  customization still work in 3.14 and are deprecated. A future release removes
  both; migrate to the `workList.*` customizations on the ui-next `WorkList`.
- **[DataTable / TanStack Table v9](./data-table.md)** — `@ohif/ui-next` upgrades
  `@tanstack/react-table` to v9. Column definitions need the `DataTableFeatures`
  generic and the `sortFn` rename; programmatic visibility toggles should go
  through `useToggleColumnVisibility`.

- **[useSegmentationExpanded](./segmentation-expanded-context.md)** — the hook
  returns `undefined` outside a `SegmentationExpandedProvider` instead of
  throwing, and no longer takes a component-name argument. Callers that wrapped
  it in `try/catch` should check for `undefined`; callers that require the
  provider should assert for themselves.

- **[Viewport element hooks](./use-viewport-refs.md)** — `useViewportRef` and
  `useViewportRefs` are replaced by `useViewportElement` for readers and
  `useViewportElementRegistration` for the viewport that owns the element, and
  `ViewportRefsProvider` is renamed `ViewportElementsProvider`. The element is now
  a subscribed value rather than a snapshot read during render.

- **[Save/report dialog](./report-dialog.md)** — the dialog for storing
  measurements, segmentations and contours replaces its series drop down with an
  explicit choice of three destinations: **Save to current**, **Save as new** and
  **Replace existing**.  The series number of a new series is editable, and the
  series descriptions used before are remembered per type of item and offered as
  completions.  `createReportDialogPrompt` takes `defaultSeriesDescription`,
  `itemType` and `rememberedDescriptionCount`, and returns a `seriesNumber`.  A
  stored instance is now identified like a loaded one, so the object just saved
  becomes the predecessor of the next save of the same data.
- **[Display set date/time ordering](./display-set-ordering.md)** — derived
  display sets are ordered by the creation date/time of the instance they show
  rather than by their series date/time, comparators registered with
  `addSameSeriesCompare` now actually run, instances tie-break by creation
  date/time before the SOP instance UID, and saved reports and segmentations are
  stamped with a creation date/time and an instance number.

- **[useCustomization](./use-customization.md)** — `@ohif/core` adds a
  `useCustomization` hook. A component that calls
  `customizationService.getCustomization` during render can now freeze at a stale
  value, because the React Compiler caches the call on the service reference,
  which never changes. Move such reads to the hook. Event handlers and non-React
  code keep calling the service directly.

- **[InputNumber](./input-number.md)** — `InputNumber.HorizontalControls` and
  `InputNumber.VerticalControls` now share `min`, `max`, `step` and `disabled`
  through a nested provider rather than by writing onto the root context object.
  That fixes constraints being discarded on every keystroke, but it means only
  **descendants** of the controls receive them; an `InputNumber.Input` rendered as
  a sibling silently falls back to `min=0, max=100, step=1`.

- **[createContext helper](./create-context.md)** — the internal
  `ui-next/lib/createContext` helper is removed. It was never exported from
  `@ohif/ui-next`; if you imported it from source, use React's own
  `createContext` and `useContext` — the compiler now provides the memoization it
  was hand-rolling.

<DocCardList />
