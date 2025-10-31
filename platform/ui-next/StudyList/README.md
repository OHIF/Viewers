
# StudyList — Composable, Headless-by-Default Study List

This package provides a **default study list** experience for the application while keeping the **architecture fully composable**. Teams can use the shipped default, lift out individual pieces (like `PatientSummary`), or assemble an entirely custom list using the **headless state + small UI primitives**.

> **Design Goal**
> Ship a great default experience without trapping UI inside a monolith. State is headless and reusable; visuals are composed from small primitives; examples are expressed as recipes.

---

## Quick Start

Render the default study list (same visuals as the prototype) with your data:

```tsx
import { StudyList, type StudyRow, type WorkflowId } from 'platform/ui-next/StudyList';

function App({ rows }: { rows: StudyRow[] }) {
  const handleLaunch = (study: StudyRow, wf: WorkflowId) => {
    // Navigate / open viewer, analytics, etc.
  };

  return <StudyList data={rows} onLaunch={handleLaunch} />;
}
````

> `StudyList` is a façade that renders the default recipe under the hood.
> For deeper customization, import the **recipe** or **headless/primitives** directly.

---

## Architecture

The package is split into **Headless State**, **Primitives**, **Recipes**, and **Utilities**. This mirrors how teams can adopt **only what they need**.

```
StudyList/
├─ headless/
│  ├─ StudyListProvider.tsx          # Context + hook (headless state contract)
│  ├─ useStudyList.ts                # Hook creating the state (selection, panel, default workflow)
│  └─ workflows-registry.ts          # Workflow types and inference utilities
│
├─ primitives/
│  ├─ StudylistLayout.tsx            # Resizable split layout for table + preview
│  └─ PreviewShell.tsx               # Shell container for preview area content
│
├─ recipes/
│  └─ DefaultStudyList.tsx           # Reference composition (the default UI)
│
├─ columns/
│  └─ defaultColumns.tsx             # Column factory (single source of truth)
│
├─ StudyList.tsx                     # Public façade -> recipe (keeps external API stable)
├─ StudyListTable.tsx                # Thin table primitive built on DataTable
├─ StudyListInstancesCell.tsx        # "Open in..." overlay cell (workflow launcher)
├─ WorkflowsMenu.tsx                 # Dropdown to pick a workflow
├─ WorkflowsInfer.ts                 # Re-exports from headless registry
├─ SettingsDialog.tsx                # Settings (default workflow)
├─ PreviewPanel.tsx                  # Default preview content (PatientSummary + thumbnails)
├─ EmptyPanel.tsx                    # Default empty state (PatientSummary)
├─ useDefaultWorkflow.ts             # localStorage persistence hook
├─ StudyListTypes.ts                 # Types (StudyRow)
├─ index.ts                          # Barrel exports for all layers
```

### Data Flow (high level)

* `useStudyListState` (headless) owns **selected row**, **panel open state**, **default workflow**, and the **launch action**.
* The default recipe wires this state up to:

  * `StudyListTable` (selection → updates `selected`)
  * `StudylistLayout` (resizable split, toggling preview visiblity)
  * `StudyListInstancesCell` + `WorkflowsMenu` (launch workflows per row)
  * `SettingsDialog` (persist default workflow via `useDefaultWorkflow`)

---

## Headless Layer

### `headless/StudyListProvider.tsx`

* **What**: Context + hook for the headless contract.
* **Shape**:

  ```ts
  type StudyListContextValue<T, W extends string> = {
    rows: T[];
    selected: T | null;
    setSelected: (r: T | null) => void;
    isPanelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    defaultWorkflow: W | null;
    setDefaultWorkflow: (wf: W | null) => void;
    availableWorkflowsFor: (row: Partial<T> | null | undefined) => readonly W[];
    launch: (row: T, wf: W) => void;
  };
  ```
* **Use**:

  * Wrap UI with `<StudyListProvider value={useStudyListState(...)}>` and consume via `useStudyList()`.

### `headless/useStudyList.ts`

* **What**: Builds the state for the provider:

  * `selected`, `isPanelOpen`
  * `defaultWorkflow` persisted via localStorage (`useDefaultWorkflow`)
  * `launch` callback (not opinionated—callers decide navigation/analytics)
  * `availableWorkflowsFor` using the registry
* **Why**: Keeps **state** and **UI** decoupled. Any UI can reuse this state (tables, cards, virtual lists, etc).

### `headless/workflows-registry.ts`

* **What**: Workflow union (`WorkflowId`) and a helper `getAvailableWorkflows(...)`.
* **Default inference**: uses study-level `workflows` if present; otherwise infers by `modalities` (adds `US Workflow` and `TMTV Workflow` as applicable).

> Re-exported via `WorkflowsInfer.ts` to keep import paths stable.

---

## Primitives

### `primitives/StudylistLayout.tsx`

* **What**: Resizable horizontal split for **table** and **preview** areas.
* **Props**: `isPanelOpen`, `onIsPanelOpenChange`, `defaultPreviewSizePercent`, `minPreviewSizePercent`.
* **Slots**:

  * `<StudylistLayout.TableArea>` — Your table and toolbar
  * `<StudylistLayout.PreviewArea>` — Your preview content
* **Tech**: wraps `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.

### `primitives/PreviewShell.tsx`

* **What**: A light container for preview content (header + scroll area).
* **Use**: Compose custom previews while keeping styling consistent.

---

## Recipe (Default UI)

### `recipes/DefaultStudyList.tsx`

* **What**: The **reference composition** that matches the original prototype’s visuals.
* **Uses**:

  * `useStudyListState` → `StudyListProvider`
  * `StudylistLayout` for split panes
  * `StudyListTable` with `defaultColumns()`
  * `SettingsDialog`, `PreviewPanel`, `EmptyPanel`
* **Why**: A working example you can (a) use as-is or (b) copy and tweak.

### `StudyList.tsx` (Façade)

* A simple component that renders the default recipe. External API remains stable.

---

## Table, Columns & Cells

### `StudyListTable.tsx`

* **What**: Thin wrapper around the Design System `DataTable` + `Table` primitives.
* **Features**: Column visibility menu, filter row, sticky header, selection, accessibility keys (Enter/Space).
* **Slots**: `toolbarLeft`, `toolbarRightExtras`, and a customizable “open panel” button slot.

### `columns/defaultColumns.tsx`

* **What**: Factory that returns the **default** columns.
* **Why**: Callers can **start here** and selectively replace cells/widths/headers:

  ```ts
  import { defaultColumns } from 'platform/ui-next/StudyList';

  const columns = defaultColumns().map(c =>
    c.accessorKey === 'description' ? { ...c, cell: MyDescriptionCell } : c
  );
  ```

### `StudyListInstancesCell.tsx`

* **What**: Cell rendering the numeric value **and** showing an overlay action on hover/selection via the DS `DataTableActionOverlayCell`.
* **Behavior**: Uses headless `useStudyList()` to:

  * Read `defaultWorkflow` for the ✱ checkmark in the menu
  * Call `launch(study, workflow)` when a workflow is picked

### `WorkflowsMenu.tsx`

* **What**: A dropdown built with DS `DropdownMenu` that lists workflows for a row.
* **Source of truth**: The menu invokes `getAvailableWorkflows({ workflows, modalities })`. Provide `row.workflows` for full control.

---

## Preview & Settings

### `PreviewPanel.tsx`

* **What**: Default preview content for a selected row.
* **Composition**:

  * `PatientSummary` (compound DS component)
  * A mock thumbnails grid (`Thumbnail`)
  * Optional drag-and-drop wiring via `react-dnd` (HTML5 backend) to support future interactions

### `EmptyPanel.tsx`

* **What**: PatientSummary-based empty state when nothing is selected.

### `SettingsDialog.tsx`

* **What**: Dialog with the **Default Workflow** selector.
* **Persistence**: Updates the headless `defaultWorkflow` which is persisted by `useDefaultWorkflow` in localStorage.

---

## Types & Utilities

### `StudyListTypes.ts`

* `StudyRow` interface:

  ```ts
  export type StudyRow = {
    patient: string;
    mrn: string;
    studyDateTime: string;
    modalities: string;
    description: string;
    accession: string;
    instances: number;
    workflows?: readonly WorkflowId[];
  };
  ```

### `useDefaultWorkflow.ts`

* **What**: LocalStorage-backed state.
* **Signature**: `useDefaultWorkflow<T extends string>(storageKey?: string, allowed?: readonly T[])`
* **Note**: When `allowed` is passed (we pass the WorkflowId union), only valid values are persisted.

---

## Design System Components Used (`ui-next/src/components`)

StudyList builds on a small set of DS primitives. Key modules:

* **DataTable** (`src/components/DataTable`)

  * `DataTable` — headless table provider over TanStack table
  * `useDataTable` — table context hook
  * `DataTableColumnHeader` — small sort header control
  * `DataTableFilterRow` — per-column filter inputs + a reset slot
  * `DataTableViewOptions` — column visibility menu
  * `DataTableActionOverlayCell` — “hover-to-actions” overlay cell
  * `DataTableToolbar`, `DataTableTitle` — header layout primitives
* **Table** (`src/components/Table`)

  * `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`
* **Buttons & Menus**

  * `Button` (`src/components/Button`)
  * `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (`src/components/DropdownMenu`)
* **Inputs & Dialog**

  * `Input` (`src/components/Input`) *(used by filter row)*
  * `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` (`src/components/Dialog`)
  * `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` (`src/components/Select`)
  * `Label` (`src/components/Label`)
* **Layout & Scroll**

  * `ScrollArea` (`src/components/ScrollArea`)
  * `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` (`src/components/Resizable`)
* **Information & Media**

  * `Icons` (`src/components/Icons`)
  * `TooltipProvider` (`src/components/Tooltip`)
  * `Thumbnail` (`src/components/Thumbnail`)
  * `PatientSummary` (`src/components/PatientSummary`) — **compound** component with:

    * `Root`, `Section`, `Icon`, `Name`, `MRN`, `Meta`, `Actions`, `Action`, `WorkflowButton`, `Patient`, `Workflows`, `Empty`, `Field`
    * Supports `get` mapping for different row shapes:

      ```tsx
      <PatientSummary.Root
        data={row}
        get={{
          name: r => r.displayName,
          mrn: r => r.patientId,
        }}
      >
        <PatientSummary.Patient />
        <PatientSummary.Workflows defaultMode={defaultWorkflow} onDefaultModeChange={setDefaultWorkflow} />
      </PatientSummary.Root>
      ```

---

## Customization Patterns

### 1) Replace or augment columns

```tsx
import { defaultColumns } from 'platform/ui-next/StudyList';
import type { StudyRow } from 'platform/ui-next/StudyList';

const cols = defaultColumns().map(col =>
  col.accessorKey === 'description'
    ? { ...col, cell: ({ row }) => <em>{row.getValue('description')}</em> }
    : col
);

// Use with the default recipe
<StudyList data={rows} columns={cols} />
```

### 2) Compose your own layout with headless + primitives

```tsx
import {
  StudyListProvider,
  useStudyListState,
  StudylistLayout,
  defaultColumns,
  StudyListTable,
  PreviewShell,
} from 'platform/ui-next/StudyList';

function MyStudyList({ rows }: { rows: StudyRow[] }) {
  const state = useStudyListState(rows, { onLaunch: (r, wf) => {/* ... */} });
  const columns = defaultColumns();

  return (
    <StudyListProvider value={state}>
      <StudylistLayout.Root
        isPanelOpen={state.isPanelOpen}
        onIsPanelOpenChange={state.setPanelOpen}
        defaultPreviewSizePercent={30}
      >
        <StudylistLayout.TableArea>
          <StudyListTable data={rows} columns={columns} onSelectionChange={([first]) => state.setSelected(first ?? null)} />
        </StudylistLayout.TableArea>
        <StudylistLayout.PreviewArea>
          <PreviewShell
            header={/* settings / close buttons */}
          >
            {/* Your custom preview content here */}
          </PreviewShell>
        </StudylistLayout.PreviewArea>
      </StudylistLayout.Root>
    </StudyListProvider>
  );
}
```

### 3) PatientSummary anywhere

You can place `PatientSummary` in the preview, above the table, or inside a cell. It reads data from `PatientSummary.Root` and can be tailored via `get`.

### 4) Workflows per study

* Provide `row.workflows` (array of strings in the allowed set) for deterministic menus.
* Otherwise, the system will infer from `row.modalities`:

  * Adds **US Workflow** when modalities include `"US"`.
  * Adds **TMTV Workflow** when modalities include `"PET/CT"` (or both `"PET"` and `"CT"` present).

---

## Event & State Semantics

* **Selection**: `StudyListTable` toggles selection on row click and `Enter`/`Space`.
* **Panel**: `StudylistLayout` controls whether the preview area is visible. The toolbar exposes a button to reopen when closed.
* **Default Workflow**: stored in `localStorage` under the `studylist.defaultWorkflow` key. The `SettingsDialog` writes to the same headless state.
* **Launch**: The action flows through `useStudyListState(..., { onLaunch })` → `launch(study, workflow)`. The default recipe calls `console.log` for demo; apps should pass a real handler.

---

## Removed / Not Present (proto-only)

During cleanup, the following were removed to keep the package lean:

* `TableContext.tsx` (legacy context)
* `StudyListColumns.tsx` (wrapper around columns)
* `playground/studylist/components/studylist-layout.tsx` (bridge to the primitive)

> If you find references to these in downstream code, update imports to the new headless and primitive locations.

---

## FAQ

**Q: Can I use this headless state with a card/list layout instead of a table?**
A: Yes. `useStudyListState`/`StudyListProvider` are UI-agnostic—render any view and call `setSelected`, `setPanelOpen`, and `launch` from your UI.

**Q: How do I restrict/extend the workflows?**
A: Supply `workflows` in your `StudyRow` items to control the menu exactly. If you need different inference rules, adapt your data to include `workflows` upstream.

**Q: Where do I change the localStorage key for default workflow?**
A: Pass `defaultWorkflowKey` in `useStudyListState(rows, { ... })`.

---

## Conventions & Dependencies

* **React + TypeScript** throughout
* **@tanstack/react-table** via DS `DataTable`
* **react-resizable-panels** via DS `Resizable*` components
* **react-dnd** (HTML5 backend) in the default preview panels only
* Zero network assumptions—data is passed in via `props.data`

---

## Changelog (architecture cleanup)

* Introduced `headless/` layer and composable primitives
* Re-expressed the working prototype as `recipes/DefaultStudyList`
* Consolidated columns into `columns/defaultColumns.tsx`
* Removed prototype-only contexts and playground bridges
