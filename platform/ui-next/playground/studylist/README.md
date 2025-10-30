# Study List — Prototype (Playground)

This directory contains a **self‑contained prototype** of the Study List UX that composes reusable primitives from the **ui‑next design system (DS)**. It also includes a few **prototype‑only compounds** (layout, settings, panels) that exist here to keep the playground isolated and easy to iterate on.

> Route: open `/studylist` via the playground loader (default route).

---

## Architecture at a glance

- **Design System (DS)** — stable, reusable primitives (under `platform/ui-next/src/components/*`) and a typed domain package (`platform/ui-next/StudyList/*`) used by products.
- **Prototype (this folder)** — domain assembly and demo:
  - Composes DS primitives into a **domain table** (`study-list-table.tsx`) + **layout** + **preview panels**.
  - Keeps **prototype‑only** compounds (`Summary` panel API, demo workflows menu) local until promotion.

### Key DS primitives used here

- **DataTable**: provider + headless state, column header, filter row, column visibility menu, and overlay action cell.
- **Table**: semantic table elements.
- **UI primitives**: Button, Dialog, Select, Label, ScrollArea, Resizable, Tooltip, Thumbnail, Icons.

> DS now ships a typed workflow model (`WorkflowId`) and in‑row action cell (canonical: `StudyListInstancesCell`). The prototype keeps its own menu (`StudylistWorkflowsMenu`) to avoid cross‑coupling while we iterate.

---

## File map & responsibilities


playground/studylist/
├─ app.tsx # End-to-end composition (theme, layout, table, preview panel)
├─ entry.tsx # Mounts
├─ index.ts # Prototype exports for local reuse
├─ types.ts # StudyRow shape for the playground
├─ columns.tsx # Column definitions (cells, labels, widths, sort)
├─ study-list-table.tsx # Domain wrapper around DS + toolbar + filter row
├─ patient-studies.json # Demo dataset
│
├─ components/
│ ├─ studylist-layout.tsx # Resizable split: table area + preview area
│ ├─ studylist-settings.tsx # Settings dialog + useDefaultWorkflow (prototype version)
│ └─ studylist-table-context.tsx # Context for default workflow + centralized onLaunch
│
├─ panels/
│ ├─ panel-summary.tsx # Prototype-only "Summary" compound (namespaced subcomponents)
│ ├─ panel-content.tsx # Preview content w/ thumbnails + Summary
│ └─ panel-default.tsx # Empty/placeholder panel using Summary
│
├─ workflows/
│ ├─ getAvailableWorkflows.ts # Heuristics to infer workflows for a study
│ └─ WorkflowsMenu.tsx # "Open in…" dropdown (prototype version)
│
└─ assets/ # Icons and images used by the playground

### What lives where?

- **Prototype (keep here for now)**
  - `components/studylist-layout.tsx`: Resizable split + open/close affordances.
  - `components/studylist-settings.tsx`: Dialog + `useDefaultWorkflow` *prototype variant*.
  - `components/studylist-table-context.tsx`: Context for `defaultMode` and centralized `onLaunch`.
  - `panels/*`: `Summary` compound and preview content.
  - `workflows/*`: Demo heuristics + prototype menu.
  - `study-list-table.tsx`: Domain wrapper around DS `DataTable` (toolbar slots, filter row).

- **Design System (already provided & used)**
  - `src/components/DataTable/*`, `src/components/Table/*`, `src/components/*` (Button, Dialog, etc.).
  - Domain package under `platform/ui-next/StudyList/*` (typed workflow model, instances cell, etc.).

---

## Data model

```ts
// playground/studylist/types.ts
export type StudyRow = {
  patient: string
  mrn: string
  studyDateTime: string
  modalities: string
  description: string
  accession: string
  instances: number
  workflows?: string[] // prototype uses strings; DS uses a typed union WorkflowId
}
````

> **Note:** The DS defines `WorkflowId` (a string union) and `getAvailableWorkflows` that only returns valid values. The prototype keeps `string[]` for flexibility but the menus/heuristics align with DS labels.

---

## Usage — compose the table + layout + panel

Minimal composition (see `app.tsx` for a full example):

```tsx
import { StudylistLayout } from './components/studylist-layout'
import { StudyListTable } from './study-list-table'
import { studyListColumns } from './columns'
import type { StudyRow } from './types'
import data from './patient-studies.json'

export function App() {
  const [selected, setSelected] = React.useState<StudyRow | null>(null)
  const [isPanelOpen, setIsPanelOpen] = React.useState(true)
  const [defaultMode, setDefaultMode] = useDefaultWorkflow()

  return (
    <StudylistLayout.Root
      isPanelOpen={isPanelOpen}
      onIsPanelOpenChange={setIsPanelOpen}
      defaultPreviewSizePercent={30}
      className="h-full w-full"
    >
      <StudylistLayout.TableArea>
        <StudyListTable
          columns={studyListColumns}
          data={data as StudyRow[]}
          title="Study List"
          isPanelOpen={isPanelOpen}
          onOpenPanel={() => setIsPanelOpen(true)}
          onSelectionChange={rows => setSelected(rows[0] ?? null)}
          defaultMode={defaultMode}
          onLaunch={(study, wf) => console.log('Launch', wf, { study })}
        />
      </StudylistLayout.TableArea>

      <StudylistLayout.PreviewArea>
        {/* Show Summary-only default or the rich preview */}
      </StudylistLayout.PreviewArea>
    </StudylistLayout.Root>
  )
}
```

---

## Columns & overlay action pattern

- Column headers use `DataTableColumnHeader` for consistent sorting affordances.
- Each column can specify `meta.label` (used by the column visibility menu) and width classes.
- The **instances** column uses the overlay action cell pattern so the “Open in…” menu appears on row focus/selection.


```tsx
// playground/studylist/columns.tsx (excerpt)
{
  accessorKey: 'instances',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Instances" align="right" />,
  cell: ({ row }) => <LaunchMenuCell row={row} value={row.getValue('instances') as number} />,
  meta: { label: 'Instances', fixedWidth: 90 }
}
```

Overlay cell:

```tsx
// playground/studylist/cells/launch-menu-cell.tsx (simplified)
<DataTableActionOverlayCell
  isActive={row.getIsSelected()}
  value={<div className="text-right">{value}</div>}
  onActivate={() => { if (!row.getIsSelected()) row.toggleSelected(true) }}
  overlay={<StudylistWorkflowsMenu ... />}
/>
```

---

## Workflows (prototype)

- `workflows/getAvailableWorkflows.ts`: If a row provides `workflows`, we use them; otherwise, we infer from `modalities`:
    - Always: “Basic Viewer”, “Segmentation”.
    - Add “US Workflow” if modalities include **US**.
    - Add “TMTV Workflow” if modalities include **PET/CT** (or both **PET** and **CT**).
- `workflows/WorkflowsMenu.tsx`: Dropdown to launch a workflow; highlights the persisted default.


> DS ships the same labels with a typed union `WorkflowId`; the prototype menu is intentionally local for iteration, but aligned to DS labels.

---

## Panels & Summary (prototype‑only, planned for promotion)

The `panels/panel-summary.tsx` file exports a **`Summary` namespace** with subcomponents to assemble a patient header and action block:

```tsx
<Summary.Root data={study}>
  <Summary.Patient />
  <Summary.Workflows defaultMode={defaultMode} onDefaultModeChange={setDefault} />
</Summary.Root>
```

Slots include `Section`, `Icon`, `Name`, `MRN`, `Meta`, `Field`, `Actions`, `Action`, and `WorkflowButton`. `PanelContent` and `PanelDefault` show how to use `Summary` for both selected and empty states.

---

## Accessibility notes

- Header cells set `aria-sort` via TanStack’s sort state.
- Overlay menus stop event propagation to preserve row selection semantics.
- Summary actions support `aria-disabled` + hidden screen reader reasons for disabled states.


---

## Run & Build

- Dev: start the UI Next dev server and open `/studylist`.
- Production playground bundle:
    `yarn --cwd platform/ui-next build:playground`
    Output: `platform/ui-next/dist/playground/`
- Optional: `npx serve platform/ui-next/dist/playground` to verify locally before uploading to Netlify.


---

## Migration status (Steps 1–6)

**Completed**

1. **Componentization (Step 1)**
    Flattened `StudyList` domain files (no subfolders), clear names, column meta labels, and overlay pattern.

2. **Design System integration (Step 2)**
    Centralized default workflow state + settings dialog pattern; unified table provider usage; context for `onLaunch`.

3. **Slots & decoupling (Step 4)**
    `StudyListTable` now exposes **toolbar slots** (`toolbarLeft`, `toolbarRightExtras`) and a **custom open‑panel button renderer**, making visuals replaceable without forking the table.

4. **Prototype consolidation (Steps 5–6)**
    - Prototype kept `Summary` and the workflows menu locally.
    - DS promoted instances action via `StudyListInstancesCell`.
    - DS action cell shim removed (legacy `ActionCell.tsx` deleted; alias provided via DS barrel export).

5. **Final pass (updates)**
    - **Tiny cleanup**: minor import and export consistency.
    - **Type hardening in DS**: `WorkflowId` union; `getAvailableWorkflows` returns only valid values.
    - **Prototype consolidation**: stable local `StudylistWorkflowsMenu` and `Summary` to avoid DS churn.
    - **Promotion prep**: DS table accepts toolbar slots; prototype APIs match DS names/labels.


---

## What can be deleted now?

- **Already done in DS**: legacy `ActionCell.tsx` was removed; DS barrel re‑exports `ActionCell` as an alias to `StudyListInstancesCell` for backward compatibility.
- **Prototype**: keep all current files; they’re either referenced or intended for promotion. No additional deletions recommended here.


---

## What will move to the DS next?

- `panels/panel-summary.tsx` → **Design‑system “Summary” compound** (namespaced subcomponents).
- `workflows/WorkflowsMenu.tsx` and `getAvailableWorkflows.ts` → **replace** with DS `WorkflowsMenu` + `WorkflowsInfer` and adopt `WorkflowId` in `playground/studylist/types.ts`.


---

## Next steps (promotion checklist)

1. **Adopt DS types in prototype**
    Change `types.ts` to use `WorkflowId[]` for `StudyRow.workflows`.
    Validate all call sites (columns, menu, panel) compile cleanly.
2. **Swap to DS workflows menu**
    Replace `StudylistWorkflowsMenu` with DS `WorkflowsMenu`; remove prototype `workflows/*`.
3. **Promote Summary**
    Move `panels/panel-summary.tsx` into DS as `src/components/Summary/*`.
    Add minimal stories/MDX and usage docs.
4. **Remove bridging exports**
    After consuming DS equivalents, delete prototype exports in `index.ts` and any now‑unused files.
5. **Docs + stories**
    Add Storybook stories for `StudyListTable` with toolbar slots, and for `Summary` in DS.


---

## Import quick reference

- DS primitives: `../../src/components/*`
- Domain table wrapper (prototype): `./study-list-table`
- Columns (prototype): `./columns`
- Layout (prototype): `./components/studylist-layout`
- Settings (prototype): `./components/studylist-settings`
- Workflows menu (prototype): `./workflows/WorkflowsMenu`
- Summary (prototype): `./panels/panel-summary`

---

# **Status:** Prototype is feature‑complete for the demo route.
**Scope to promote:** Summary compound + workflows menu/heuristics, and eventual adoption of `WorkflowId` in prototype types.
