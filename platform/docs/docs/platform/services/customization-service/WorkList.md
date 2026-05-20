---
title: Work List Customization
summary: Documentation for configuring the OHIF WorkList study-list route — selecting between the new (default) and legacy variants, the preview panel's series view (thumbnails, list, or both), and the columns shown in the study-list table.
sidebar_position: 9
---

# Work List

The `workList.*` namespace customizes the WorkList study-list route used as the default landing page in OHIF.

With the exception of `workList.variant` itself, the customizations below only apply when `workList.variant` is `'default'`; they are ignored when the legacy study list is mounted.

## `workList.variant`

Selects which study-list route is mounted at `/`.

- `'default'` (default customization value): the new ui-next WorkList, introduced in 3.13.
- `'legacy'`: the pre-3.13 WorkList (internally `LegacyWorkList`). Use this as an opt-out while migrating to the new study list.

The customization is read once during route registration, so changing it requires a reload.

## `workList.previewSeriesView`

Controls which series views are available in the preview panel that opens to the right of the study list.

- `'all'` (default customization value): the thumbnails/list toggle is visible. The initial preview view is thumbnails.
- `'thumbnails'`: the toggle is hidden; the preview is locked to thumbnails.
- `'list'`: the toggle is hidden; the preview is locked to the series list.

Note: the preview is forced to `'list'` when the active data source either declares `thumbnailRendering` as `'wadors'` or `'thumbnailDirect'`, or declares `thumbnailRequestStrategy` as `'bulkDataRetrieve'` (the default value for `thumbnailRequestStrategy`). In those cases, the customization is ignored and the technical override wins.

:::tip

The customizations below — `workList.columns`, `workList.renderPreviewContent`, and `workList.settingsMenuItems` — accept functions whose return values frequently need access to React hooks, the services manager, or the commands manager (e.g. to open modals, navigate, run commands, or build translated labels). They can be set from `window.config`, but they're generally easier to author in a custom extension's `getCustomizationModule`, where the services manager is in scope and components can use hooks normally. Plain config is best suited to simple tweaks like reordering, removing, or inserting items that only need static handlers.

:::

## `workList.columns`

Builds the column set for the WorkList table. The customization is a function with the same shape as `StudyList.defaultColumns` — it receives the default `ColumnDef[]` and must return a `ColumnDef[]`. Use it to reorder, hide, or insert columns without rewriting the defaults.

```ts
type WorkListColumns = (
  defaults: ColumnDef<StudyRow, unknown>[]
) => ColumnDef<StudyRow, unknown>[];
```

The default customization value is the identity function (`(defaults) => defaults`), so out of the box the table shows `Patient`, `MRN`, `Study Date`, `Modalities`, `Description`, `Accession`, `Instances`, and a trailing actions column in that order. If the customization returns anything that is not an array, WorkList falls back to the defaults.

## `workList.renderPreviewContent`

Render function for the preview panel that opens to the right of the study list. The customization receives the host React and the same data the built-in renderer uses — series and thumbnails are fetched by the `SidePanelPreview` shell and passed in as props.

```ts
type PreviewContentProps = {
  study: StudyRow | null;
  series: any[];
  seriesView: 'all' | 'thumbnails' | 'list';
  onThumbnailImageError: (seriesUID: string) => void;
};

type RenderPreviewContent = (
  React: typeof import('react'),
  props: PreviewContentProps
) => React.ReactNode;
```

### Props

- **`study`** — the currently selected `StudyRow` (`null` when no study is selected). Useful fields include `studyInstanceUid`, `patientName`, `mrn`, `date`, `modalities`, `description`, `accession`, and `instances`.
- **`series`** — the series belonging to `study`, sorted by series date. Each item has the raw fields returned by the data source (`seriesInstanceUid`, `modality`, `description`, `seriesDate`, `seriesNumber`, `numSeriesInstances`, etc.) plus a `thumbnailStatus` added by the shell:
  - `{ status: 'loading' }` — a thumbnail fetch is in flight.
  - `{ status: 'ready', src }` — `src` is the URL (often a `blob:` URL) you can render in an `<img>`.
  - `{ status: 'notAvailable' }` — the fetch failed or `onThumbnailImageError` was called for this series.
  - `{ status: 'notApplicable' }` — the modality has no displayable thumbnail (e.g. SR, KO).
- **`seriesView`** — `'all' | 'thumbnails' | 'list'`. Resolved from `workList.previewSeriesView`, with `'list'` forced when the active data source uses `wadors`/`thumbnailDirect` rendering or `bulkDataRetrieve` retrieval. Honor it if you want to respect the user's toggle and the data-source constraints; ignore it if your custom layout doesn't have a thumbnails/list distinction.
- **`onThumbnailImageError`** — call with a series UID when an `<img>` you render fails to load. The shell marks that series as `notAvailable` and revokes its blob URL if needed. Wire it to your image element's `onError` to keep the state consistent.

Use this customization to change the preview layout (e.g. a different patient summary, a custom series grid) while keeping the fetch, abort-on-selection-change, and bounded thumbnail worker pool intact. When the customization is unset (the default) or not a function, WorkList uses the built-in `<StudyList.PreviewContainer>` layout.

## `workList.settingsMenuItems`

Builds the items in the WorkList settings popover (the gear menu in the top right). The customization is a function that receives the default items and must return a `SettingsMenuItem[]`.

```ts
type SettingsMenuItem = {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
};

type WorkListSettingsMenuItems = (defaults: SettingsMenuItem[]) => SettingsMenuItem[];
```

The default items are:

- `about` — opens the About modal (`ohif.aboutModal` customization).
- `userPreferences` — opens the User Preferences modal (`ohif.userPreferencesModal` customization).
- `logout` — only included when `appConfig.oidc` is configured; navigates to `/logout`.

Use it to reorder, remove, or insert items (e.g. a "Help" link, a "Send feedback" action) without rebuilding the popover shell. If the customization returns a non-array value, WorkList falls back to the defaults.

import { workListCustomizations, TableGenerator } from './sampleCustomizations';

{TableGenerator(workListCustomizations)}
