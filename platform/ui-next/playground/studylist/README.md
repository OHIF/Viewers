# Studylist Prototype

This folder contains a self-contained prototype of the Study List UX, using the design system’s composable DataTable primitives and a compound components pattern.

- Route: visit `/studylist` via the playground loader (default route).
- Purpose: demonstrate a domain-specific table (StudyListTable) that composes reusable building blocks from `src/components`.

## What’s Reusable (design system)
- `src/components/DataTable/*`:
  - `DataTable` (provider): owns TanStack table state via context.
  - `DataTableToolbar`, `DataTableTitle`.
  - `DataTableColumnHeader`.
  - `DataTableViewOptions` (columns menu).
  - `DataTableFilterRow`.
  - `DataTableActionOverlayCell` (and `DataTableActionCell` alias).
- Other primitives (Table, Button, DropdownMenu, Input, etc.).

## What’s Domain-Specific (prototype)
- `studylist/study-list-table.tsx`: composes the reusable pieces for the Study List.
- `studylist/columns.tsx`: column defs (sorting, labels, cells) for the Study domain.
- `studylist/cells/launch-menu-cell.tsx`: instance action menu using the overlay cell pattern.
- `studylist/panels/*`: side panel content and default view.
- `studylist/patient-studies.json`: mock data.
- `studylist/types.ts`: domain type `StudyRow`.

## Compound Components Rationale
- The `DataTable` provider centralizes TanStack state (sorting, filters, visibility, selection) so sibling components don’t receive a `table` prop.
- Consumers use:
  - Toolbar & Title for layout.
  - ViewOptions to toggle column visibility.
  - FilterRow for column filters and a reset slot.
  - ColumnHeader to control sorting per column.
- The playground’s `StudyListTable` shows how to compose these while keeping domain logic local.

## Run
- Start the UI Next dev server as usual, then open `/studylist`.

## Notes
- Column labels are added via `meta.label` in `columns.tsx`, used by `DataTableViewOptions` for friendly names.
- The provider approach intentionally mirrors shadcn’s composable primitives style: no monolithic DataTable abstraction.
