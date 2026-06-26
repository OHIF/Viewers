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

The customizations below often involve functions — `workList.renderPreviewContent` and `workList.settingsMenuItems` are functions, and `workList.columns` (a value) commonly carries cell/header renderers or an `$apply` transform. Those functions frequently need access to React hooks, the services manager, or the commands manager (e.g. to open modals, navigate, run commands, or build translated labels). They can be set from `window.config`, but they're generally easier to author in a custom extension's `getCustomizationModule`, where the services manager is in scope and components can use hooks normally. Plain config is best suited to simple tweaks like reordering, removing, or inserting items that only need static handlers.

:::

## `workList.columns`

The column set for the WorkList table, registered as a **value** — `ColumnDef<StudyRow, unknown>[]` — rather than a function. The default is `StudyList.defaultColumns`, so out of the box the table shows `Patient`, `MRN`, `Study Date`, `Modalities`, `Description`, `Accession`, `Instances`, and a trailing actions column in that order.

Because it is a plain array, you customize it with [immutability-helper](https://github.com/kolodny/immutability-helper) commands:

| Command | Use |
| --- | --- |
| `$splice` | reorder, insert, or remove columns |
| `$set` / `$merge` | tweak a column's `meta` (label, `minWidth`, `priority`, `align`) |
| `$set` a `cell`/`header` | replace a column's renderer |
| `$apply: (cols) => cols` | run your own function over the current columns and return the new array |

The first three commands cover the common, declarative tweaks. `$apply` is the general-purpose option for anything they don't express cleanly: instead of describing the change with a command, you receive the current `ColumnDef[]` and return the array you want. Because it's a plain function you can use normal JavaScript — `find`, `filter`, `map`, `slice`, conditionals — which makes it the right choice for moves, conditional inserts, or any edit that should be driven by a column's `id` rather than its position. For example, reordering by id:

```ts
'workList.columns': {
  $apply: columns => {
    // Move "Modalities" to the front, leaving everything else in order.
    const modalities = columns.find(c => c.id === 'modalities');
    return modalities ? [modalities, ...columns.filter(c => c.id !== 'modalities')] : columns;
  },
}
```

For a simple, display-only column, `StudyList.textColumn(id, label, meta?)` fills in the accessor/header/cell wiring for you:

```ts
window.config = {
  customizationService: [
    {
      'workList.columns': {
        // Insert before the trailing actions column so it stays at row end.
        $apply: columns => {
          const at = columns.findIndex(c => c.id === 'actions');
          const referring = StudyList.textColumn('referringPhysicianName', 'Referring Physician');
          return [...columns.slice(0, at), referring, ...columns.slice(at)];
        },
      },
    },
  ],
};
```

A pure-data tweak (e.g. relabel) needs no function at all:

```ts
'workList.columns': { 2: { meta: { label: { $set: 'Study Date / Time' } } } }
```

### Surfacing an attribute the data source doesn't map yet

A column can only display data that's already on the study row. The default DICOMweb data source maps a fixed set of fields (`patientName`, `mrn`, `date`/`time`, `accession`, `description`, `modalities`, `instances`, `studyInstanceUid`, `referringPhysicianName`). To add a column for a DICOM attribute outside that set — say **Requesting Physician** `(0032,1032)` — extend the QIDO handling in `extensions/default/src/DicomWebDataSource/qido.js`:

1. **Request the tag** — add it to `includefield` in `mapParams`, so the server is asked to return it:

   ```js
   const commaSeparatedFields = [
     '00081030', // Study Description
     '00080060', // Modality
     '00080090', // Referring Physician's Name
     '00321032', // Requesting Physician
   ].join(',');
   ```

2. **Map it onto the row** — in `processResults` (a `PN`-VR field, so it goes through `formatPN`/`getName` like `patientName`):

   ```js
   requestingPhysician: utils.formatPN(getName(qidoStudy['00321032'])) || '',
   ```

Now any column can read `row.requestingPhysician` (e.g. `StudyList.textColumn('requestingPhysician', 'Requesting Physician')`). Note that **`StudyRow` does not need editing** — it carries an index signature, so data-source-mapped fields are readable without a type change.

Two caveats: the server must actually return the tag (it has to support `includefield` — see the data source's `qidoSupportsIncludeField` — and the studies must carry the attribute), and this is a data-source-wide change, not scoped to the worklist.

### Gotchas and limitations

- **Renderers aren't serializable.** A column's `accessorFn`, `cell`, `header`, `filterFn`, and `sortingFn` are functions. `$set`/`$push` accept them, but a column that renders anything beyond plain text still requires code — you can't express it as pure JSON config. `StudyList.textColumn` covers the simple text case.
- **The `actions` column should stay last (cosmetic).** Its hover menu is right-aligned to anchor the row end, so placing it mid-row just looks wrong — it's not a functional requirement. Insert new columns *before* it (e.g. `$splice` at its index, or the `$apply` pattern above); a bare `$push` lands *after* it, leaving the actions menu mid-row.
- **Index-based commands are position-fragile.** `{ 2: { … } }` targets whatever is at index 2, which shifts if earlier columns are added/removed. Prefer `$apply` with a `findIndex`/`id` lookup for edits that should survive reordering.
- If the merged value is not an array, WorkList falls back to `StudyList.defaultColumns`.

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
