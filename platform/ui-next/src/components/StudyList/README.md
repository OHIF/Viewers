# StudyList (Design System) — Composable, Headless‑First Study List

A default, high‑quality Study List built from small, reusable building blocks and a headless state layer. Use the shipped default, or compose your own with the same state primitives.

---

## Quick Start

Default experience with your data and launch handler:

```tsx
import React from 'react';
import { StudyList, type StudyRow, type WorkflowId } from '@ohif/ui-next';

function App({ rows }: { rows: StudyRow[] }) {
  const handleLaunch = React.useCallback((study: StudyRow, wf: WorkflowId) => {
    // Navigate to your viewer / track analytics / etc.
  }, []);

  return <StudyList data={rows} onLaunch={handleLaunch} />;
}
```

Notes
- `StudyList` is a façade that renders the default Desktop layout under the hood.
- For deeper customization, import headless state and building blocks directly from `@ohif/ui-next`.

---

## File Structure

```
ui-next/src/components/StudyList/
├── headless/                       # State management (UI‑agnostic)
│   ├── StudyListProvider.tsx
│   ├── useStudyList.ts
│   └── workflows-registry.ts
│
├── components/                     # Building blocks
│   ├── PreviewPanelContent.tsx
│   ├── PreviewPanelEmpty.tsx
│   ├── PreviewPanelShell.tsx       # Preview container (header + scroll)
│   ├── SettingsPopover.tsx
│   ├── StudyListInstancesCell.tsx
│   ├── StudyListLayout.tsx         # Resizable split layout
│   ├── StudyListTable.tsx          # Table built on DS DataTable
│   └── WorkflowsMenu.tsx
│
├── layouts/                        # Compositions using components/
│   ├── StudyListLargeLayout.tsx    # Default Study List recipe
│   ├── StudyListMediumLayout.tsx   # (future)
│   └── StudyListSmallLayout.tsx    # (future)
│
├── columns/
│   └── defaultColumns.tsx          # Default columns factory used by the table
│
├── StudyList.tsx                   # Future responsive wrapper; currently renders Large
├── StudyListTypes.ts               # Default row type (StudyRow) and related types
├── WorkflowsInfer.ts               # Re-exports workflow ids + inference utilities
├── useDefaultWorkflow.ts           # localStorage-backed default workflow hook
└── index.ts
```

---

## Architecture

- Headless state (in `headless/`) owns selection, preview panel open state, default workflow persisted to localStorage, and a `launch` action handler.
- Building blocks (in `components/`) are small, focused UI pieces that read from DS primitives (e.g., `DataTable`, `Table`, `DropdownMenu`, `Resizable`).
- Layouts (in `layouts/`) compose building blocks into responsive study list experiences. `StudyListLargeLayout` is the default.
- The façade `StudyList` is a future responsive wrapper; it currently renders `StudyListLargeLayout` to provide a stable entry point.

### Data Flow
- `useStudyListState` builds the headless state and is provided via `<StudyListProvider value={...}>`.
- `StudyListTable` produces selection changes which update `selected`.
- `StudyListLayout` shows/hides and resizes the preview area; `OpenPreviewButton` reopens it when closed.
- `StudyListInstancesCell` and `WorkflowsMenu` launch workflows per row via `launch(study, workflow)`.
- `SettingsPopover` changes the default workflow via `useDefaultWorkflow`.

---

## Headless State

### `headless/StudyListProvider.tsx`
- Context + hook defining the contract:
  - `rows`, `selected`, `setSelected`, `isPanelOpen`, `setPanelOpen`,
    `defaultWorkflow`, `setDefaultWorkflow`, `availableWorkflowsFor`, `launch`.
- Usage: wrap UI with `<StudyListProvider value={useStudyListState(rows, { onLaunch })}>` and consume via `useStudyList()`.

### `headless/useStudyList.ts`
- Builds state: selection, panel open, `defaultWorkflow` (persisted), `launch`, and `availableWorkflowsFor` using the registry.
- Keeps state/UI decoupled so any view (table, cards, virtual list) can reuse it.

### `headless/workflows-registry.ts`
- Workflow union (`WorkflowId`) and `getAvailableWorkflows(...)` helper.
- Inference: respects `row.workflows` when present; otherwise derives from `modalities` (adds US or TMTV where applicable).
- Re-exported via `WorkflowsInfer.ts` for stable import paths.

---

## Building Blocks

### `components/StudyListLayout.tsx`
- Resizable horizontal split for table and preview.
- Props: `isPanelOpen`, `onIsPanelOpenChange`, `defaultPreviewSizePercent`, `minPreviewSizePercent`, `table`, `preview`.
- Hook: `useStudyListLayout()`; `OpenPreviewButton` re‑opens the preview when closed.

### `components/PreviewPanelShell.tsx`
- Light container for preview content (header slot + scroll area).

### `components/StudyListTable.tsx`
- Thin wrapper around DS `DataTable` + `Table`.
- Features: column visibility menu, filter row, sticky header, selection with keyboard support (Enter/Space).
- Slots: `toolbarLeft`, `toolbarRightExtras`, and `renderOpenPanelButton` to re‑open preview area.

### `components/StudyListInstancesCell.tsx`
- Renders numeric value and an overlay action on hover/selection via DS `DataTableActionOverlayCell`.
- Reads `defaultWorkflow` and calls `launch(study, workflow)` from headless state.

### `components/WorkflowsMenu.tsx`
- Dropdown built with DS `DropdownMenu` listing workflows for a row.
- Source of truth: `getAvailableWorkflows({ workflows, modalities })`.

### `components/SettingsPopover.tsx`
- Popover content for selecting the default workflow, persisted via `useDefaultWorkflow`.

### `components/PreviewPanelContent.tsx` and `components/PreviewPanelEmpty.tsx`
- Default preview content using `PatientSummary`; the former renders thumbnails and workflows for the selected row, the latter renders an empty state.

---

## Layouts

### `layouts/StudyListLargeLayout.tsx`
- The default composition used by `StudyList`.
- Wires `useStudyListState` to `StudyListProvider`, `StudyListLayout`, `StudyListTable`, `SettingsPopover`, `PreviewPanelContent`, and `PreviewPanelEmpty`.

---

## Columns & Types

### `columns/defaultColumns.tsx`
- Factory returning default columns; start here and selectively replace cells/widths/headers.

### `StudyListTypes.ts`
- Exposes `StudyRow` (the default row shape).

---

## Import Examples

- Use the façade (recommended):
  - `import { StudyList } from '@ohif/ui-next';`
- Use the default recipe directly:
  - `import { StudyListLargeLayout } from '@ohif/ui-next';`
- Compose your own with headless + blocks:
  - `import { StudyListProvider, useStudyListState, StudyListLayout, StudyListTable } from '@ohif/ui-next';`

Internal monorepo path (for local development): `platform/ui-next/src/components/StudyList`.

---

## Behavior & Semantics

- Selection: row click toggles selection; when a default workflow is set, clicking always selects (second click does not unselect). Enter/Space mirror click.
- Double‑click: when a default workflow is set, double‑click launches the selected study via `launch`.
- Panel: `StudyListLayout` controls preview visibility and size. When closed, a button appears in the toolbar to reopen it.
- Default workflow: stored under `studylist.defaultWorkflow` in localStorage via `useDefaultWorkflow`.
- Launch: flows through `useStudyListState(..., { onLaunch })` → `launch(study, workflow)`. The default layout delegates to the provided `onLaunch`.

---

## Design System dependencies

- DataTable (`@ohif/ui-next`)
  - `DataTable`, `useDataTable`, `DataTableColumnHeader`, `DataTableFilterRow`,
    `DataTableViewOptions`, `DataTablePagination`, `DataTableActionOverlayCell`,
    `DataTableToolbar`, `DataTableTitle`.
- Table: `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`.
- Inputs & Menus: `Button`, `DropdownMenu`, `Select`, `Popover`, `Label`.
- Layout & Scroll: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`, `ScrollArea`.
- Information & Media: `Icons`, `TooltipProvider`, `Thumbnail`, `PatientSummary`.

---

## Customization Patterns

### Replace or augment columns

  ```tsx
  import React from 'react';
  import { StudyList, defaultColumns, type StudyRow } from '@ohif/ui-next';

  const columns = defaultColumns().map(col =>
    col.accessorKey === 'description'
      ? { ...col, cell: ({ row }) => <em>{row.getValue('description')}</em> }
      : col
  );

  export function App({ rows }: { rows: StudyRow[] }) {
    return <StudyList data={rows} columns={columns} />;
  }
  ```

### Compose your own layout with headless + blocks

  ```tsx
  import React from 'react';
  import {
    StudyListProvider,
    useStudyListState,
    StudyListLayout,
    StudyListTable,
    defaultColumns,
    type StudyRow,
    type WorkflowId,
  } from '@ohif/ui-next';

  export function CustomStudyList({ rows }: { rows: StudyRow[] }) {
    const state = useStudyListState<StudyRow, WorkflowId>(rows, {
      onLaunch(study, wf) {
        // custom launch behavior
      },
    });

    return (
      <StudyListProvider value={state}>
        <StudyListLayout
          isPanelOpen={state.isPanelOpen}
          onIsPanelOpenChange={state.setPanelOpen}
          defaultPreviewSizePercent={30}
          className="h-full w-full"
          table={
            <StudyListTable
              data={rows}
              columns={defaultColumns()}
              onSelectionChange={(sel) => state.setSelected(sel[0] ?? null)}
              isPanelOpen={state.isPanelOpen}
              onOpenPanel={() => state.setPanelOpen(true)}
            />
          }
          preview={
            <div>{/* Your preview content */}</div>
          }
        />
      </StudyListProvider>
    );
  }
  ```

### PatientSummary anywhere

  Place `PatientSummary` wherever you need it (preview panel, above the table, or inside a cell).
  Use the StudyList headless hook to wire workflows and launch behavior.

  Note: `PatientSummary.Workflows` is presentation‑only. It does not infer or fetch workflows.
  Always pass an explicit list (e.g., from `useStudyList().availableWorkflowsFor(row)` or `WorkflowsInfer`).

  In‑context example (inside a component rendered under `StudyListProvider` or `StudyList*Layout`):

  ```tsx
  import React from 'react';
  import { PatientSummary, useStudyList, type WorkflowId } from '@ohif/ui-next';

  function SummaryForRow({ row }: { row: any }) {
    const { availableWorkflowsFor, defaultWorkflow, setDefaultWorkflow, launch } =
      useStudyList<any, WorkflowId>();

    return (
      <PatientSummary data={row}>
        <PatientSummary.Patient />
        <PatientSummary.Workflows<WorkflowId>
          workflows={availableWorkflowsFor(row)}
          defaultMode={defaultWorkflow}
          onDefaultModeChange={setDefaultWorkflow}
          onLaunchWorkflow={(data, wf) => data && launch(data, wf)}
        />
      </PatientSummary>
    );
  }
  ```

  #### Alternate title/subtitle mapping (e.g., Description/Accession):

  ```tsx
  import React from 'react';
  import { PatientSummary, useStudyList, type WorkflowId } from '@ohif/ui-next';

  function SummaryWithMapping({ row }: { row: any }) {
    const { availableWorkflowsFor, defaultWorkflow, setDefaultWorkflow, launch } =
      useStudyList<any, WorkflowId>();

    return (
      <PatientSummary
        data={row}
        get={{
          title: r => r.description,
          subtitle: r => r.accession,
        }}
      >
        <PatientSummary.Section variant="row" align="center">
          <PatientSummary.Icon />
          <div className="min-w-0">
            <PatientSummary.Title />
            <PatientSummary.Subtitle prefix="Accession: " />
          </div>
        </PatientSummary.Section>
        <PatientSummary.Workflows<WorkflowId>
          workflows={availableWorkflowsFor(row)}
          defaultMode={defaultWorkflow}
          onDefaultModeChange={setDefaultWorkflow}
          onLaunchWorkflow={(data, wf) => data && launch(data, wf)}
        />
      </PatientSummary>
    );
  }
  ```

- Deterministic workflows
  - Pass `row.workflows` (strings in the allowed set) to control the menu per row.
  - Otherwise inference derives from `modalities` (adds US or TMTV where applicable).
  - Workflow ids and inference helpers are exported from `WorkflowsInfer`.
  - `PatientSummary.Workflows` never computes available workflows; supply them from headless.

---

## FAQ

- Can I reuse the headless state with a card or grid view?
  - Yes. `useStudyListState`/`StudyListProvider` are UI‑agnostic. Render any view and call `setSelected`, `setPanelOpen`, and `launch` from your UI.
- How do I restrict or extend workflows?
  - Provide `workflows` per study row. If you need different inference rules, adapt your data to include that list upstream.
- Where do I change the localStorage key used for the default workflow?
  - Pass `defaultWorkflowKey` to `useStudyListState(rows, { defaultWorkflowKey })`.

---

## Conventions & Libraries

- React + TypeScript
- `@tanstack/react-table` via DS `DataTable`
- `react-resizable-panels` via DS `Resizable*`
- `react-dnd` (HTML5 backend) used in the default preview only

## Changelog (DS Migration)

- Moved StudyList to the Design System at `src/components/StudyList/`.
- Renamed `StudylistLayout` → `StudyListLayout` and `useStudylistLayout` → `useStudyListLayout`.
- Consolidated building blocks under `components/` and compositions under `layouts/`.
- Renamed `DesktopLayout` → `StudyListLargeLayout` (default). Removed `DefaultStudyList` alias.

---

## Future Layout Examples

The API supports multiple responsive compositions. For example, we may add:

- `StudyListMediumLayout` — a compact table + preview with adjusted paddings.
- `StudyListSmallLayout` — a mobile‑first single‑pane list with an overlay preview.

Example usage (conceptual):

```tsx
import { StudyListMediumLayout, StudyListSmallLayout } from '@ohif/ui-next';

// Medium
<StudyListMediumLayout data={rows} onLaunch={handleLaunch} />

// Small
<StudyListSmallLayout data={rows} onLaunch={handleLaunch} />
```
