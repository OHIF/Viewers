# Studylist Prototype

This folder contains a self-contained prototype of the Study List UX, built on top of composable DataTable primitives implemented as compound components in the design system.

- Route: visit `/studylist` via the playground loader (default route).
- Goal: demonstrate a domain-specific table (StudyListTable) that composes reusable building blocks from `src/components`.

## DataTable – Files, Exports, and Responsibilities

All reusable pieces live under `platform/ui-next/src/components/DataTable/` and are exported from `index.ts`.

- Provider and hook
  - `DataTable.tsx`: Context provider that owns TanStack state (sorting, filters, visibility, selection) and wires `useReactTable`.
  - `context.tsx`: Defines `DataTableContext` and `useDataTable<T>()` hook.
- Compound layout helpers
  - `Toolbar.tsx`: Simple header container for title and controls.
  - `Title.tsx`: Styled title, typically used inside the toolbar.
- Column header and menus
  - `ColumnHeader.tsx`: Sortable header control. Accepts `column` from TanStack or a `columnId` when used within the provider.
  - `ViewOptions.tsx`: “Columns” menu to toggle column visibility. Requires the provider; supports `getLabel`/`canHide`/`buttonText` props.
- Filters
  - `FilterRow.tsx`: Renders a filter input cell for each visible column. Requires the provider.
    - Props: `excludeColumnIds?: string[]`, `resetCellId?: string`, `onReset?: () => void`, `renderCell?`, `inputClassName?`.
- Overlay/action cell
  - `ActionOverlayCell.tsx`: Encapsulates the “value with hover/selection overlay” pattern.
  - `ActionCell.tsx`: Re-exports ActionOverlayCell as `DataTableActionCell` for naming alignment.
- Barrel exports
  - `index.ts`: Exposes
    - `DataTable`, `useDataTable`, `DataTableToolbar`, `DataTableTitle`
    - `DataTableColumnHeader`, `DataTableViewOptions`, `DataTableFilterRow`
    - `DataTableActionOverlayCell`, `DataTableActionCell`

### Core APIs

- `DataTable<T>` provider
  - Props: `data`, `columns`, `getRowId?`, `initialSorting?`, `initialVisibility?`, `enforceSingleSelection?`, `onSelectionChange?`.
  - Context: `{ table, sorting, setSorting, columnVisibility, setColumnVisibility, rowSelection, setRowSelection, columnFilters, setColumnFilters, resetFilters }`.

- `DataTableColumnHeader`
  - Props: `title`, `align?`, plus either `column` (TanStack Column) or `columnId` when used inside the provider.
  - Behavior: toggles sorting and shows ▲/▼/↕ indicator.

- `DataTableViewOptions`
  - Props: `getLabel? (id) => string`, `canHide? (id) => boolean`, `buttonText?`.
  - Behavior: lists hideable columns and toggles visibility.

- `DataTableFilterRow`
  - Props: `excludeColumnIds?`, `resetCellId?`, `onReset?`, `renderCell?`, `inputClassName?`.
  - Behavior: renders an `Input` for each visible column unless excluded; if a column id matches `resetCellId`, a Reset button is shown instead.

- `DataTableActionOverlayCell`
  - Props: `isActive`, `value`, `overlay`, `onActivate?`, `alignRight?`.
  - Behavior: hides the value on hover/selection and reveals the overlay control; stops propagation and supports pre-activating selection.

## Usage Patterns

1) Wrap table area with the provider

```tsx
import { DataTable, DataTableToolbar, DataTableTitle, DataTableFilterRow, DataTableViewOptions, useDataTable } from '../../src/components/DataTable'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../src/components/Table'

export function MyDomainTable({ data, columns }) {
  return (
    <DataTable data={data} columns={columns} enforceSingleSelection>
      <Content />
    </DataTable>
  )
}

function Content() {
  const { table, setColumnFilters } = useDataTable<any>()
  return (
    <div className="flex h-full flex-col">
      <DataTableToolbar>
        <DataTableTitle>My Table</DataTableTitle>
        <div className="absolute right-0">
          <DataTableViewOptions getLabel={(id) => (table.getColumn(id)?.columnDef.meta as { label?: string } | undefined)?.label ?? id} />
        </div>
      </DataTableToolbar>
      <Table noScroll>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} className="bg-muted sticky top-0 z-10" aria-sort={(() => {
                  const s = header.column.getIsSorted() as false | 'asc' | 'desc'
                  return s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none'
                })()}>
                  {header.isPlaceholder ? null : header.column.columnDef.header?.(header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <DataTableFilterRow resetCellId="instances" onReset={() => setColumnFilters([])} />
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} onClick={() => row.toggleSelected()} aria-selected={row.getIsSelected()} className="group cursor-pointer">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{cell.column.columnDef.cell?.(cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

2) Define columns with `DataTableColumnHeader`

```tsx
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '../../src/components/DataTable'

export const columns: ColumnDef<any, unknown>[] = [
  {
    accessorKey: 'patient',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    meta: { label: 'Patient' },
  },
]
```

3) Use the overlay action cell pattern for inline actions

```tsx
import { DataTableActionOverlayCell } from '../../src/components/DataTable'

function LaunchMenuCell({ row, value }: { row: any; value: number }) {
  return (
    <DataTableActionOverlayCell
      isActive={row.getIsSelected()}
      value={<div className="text-right">{value}</div>}
      onActivate={() => { if (!row.getIsSelected()) row.toggleSelected(true) }}
      overlay={<button>Open in…</button>}
    />
  )
}
```

## Reusable vs. Domain Split

- Reusable (design system)
  - DataTable provider + primitives in `src/components/DataTable/*`.
  - UI primitives: `Table`, `Button`, `DropdownMenu`, `Input`, etc.
- Domain (prototype)
  - `study-list-table.tsx`, `columns.tsx`, `cells/launch-menu-cell.tsx`, `panels/*`, `patient-studies.json`, `types.ts`.

## Accessibility and Labels

- Headers should set `aria-sort` based on `column.getIsSorted()`.
- Add `meta.label` to each column; `DataTableViewOptions` uses it to show friendly names.

## Run

- Start the UI Next dev server and navigate to `/studylist`.

## Notes

- Components are context-only where appropriate (no `table` prop for `FilterRow` and `ViewOptions`).
- This follows shadcn’s composable primitives guidance — no monolithic DataTable abstraction.
