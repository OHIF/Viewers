---
sidebar_position: 5
sidebar_label: DataTable / TanStack Table v9
title: DataTable moves to TanStack Table v9
---

# DataTable moves to TanStack Table v9

`@ohif/ui-next` upgrades `@tanstack/react-table` from v8 to **v9**. If you consume
the `DataTable` compound component — directly, or by supplying columns to the
WorkList through the `workList.tableColumns` customization — you must update your
column definitions. If you never touch `DataTable` or its columns, nothing here
applies to you.

## `ColumnDef` gains a features generic

v9 threads the table's feature set through every type. Column definitions you
pass to `DataTable` must use the exported `DataTableFeatures` as the first
generic argument:

```diff
-import type { ColumnDef } from '@tanstack/react-table';
+import type { ColumnDef } from '@tanstack/react-table';
+import type { DataTableFeatures } from '@ohif/ui-next';

-const columns: ColumnDef<StudyRow>[] = [ ... ];
+const columns: ColumnDef<DataTableFeatures, StudyRow>[] = [ ... ];
```

The feature set itself (`dataTableFeatures`) is defined once by `DataTable` and
registers filtering, visibility, pagination, selection, and sorting. You do not
configure row models yourself.

## `sortingFn` is now `sortFn`

v9 renames the custom sort function on a column definition. A stale `sortingFn`
is **silently ignored** — the column falls back to default sorting with no
warning — so search your column definitions for it:

```diff
 {
   id: 'instances',
   accessorKey: 'instances',
-  sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
+  sortFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
 }
```

The signature is unchanged: `(rowA, rowB, columnId) => number`.

## `VisibilityState` is now `ColumnVisibilityState`

If you type the `initialVisibility` prop, the type was renamed:

```diff
-import type { VisibilityState } from '@tanstack/react-table';
+import type { ColumnVisibilityState } from '@tanstack/react-table';
```

## Toggling column visibility programmatically

`DataTable` distinguishes deliberate visibility choices from its own
responsive-layout changes (narrow tables drop low-priority columns
automatically). Use the exported hook for any toggle you initiate:

```tsx
import { useToggleColumnVisibility } from '@ohif/ui-next';

const toggleColumnVisibility = useToggleColumnVisibility();
toggleColumnVisibility('modalities', false);
```

A hide made through this hook is sticky — the responsive layout will not
auto-restore the column when the table grows. Calling
`column.toggleVisibility()` directly still works, but the layout treats the
change as its own and may revert it on the next width change.

## Do not spread or destructure table objects

v9 places row, cell, column, and header methods on prototypes. Spreading or
destructuring one of these objects (`{ ...row }`, `const { getValue } = row`)
silently drops its methods. Always call methods through the object.

## If you compile your extension with the React Compiler

TanStack exposes state through methods on identity-stable objects —
`row.getIsSelected()` and `column.getIsSorted()` are examples, not the full
list. The rule: any method whose answer changes as the user interacts
(selection, sorting, visibility, filters, expansion, pinning) belongs to this
category. A compiled component that calls one of these during render caches
the answer against an object that never changes, so the value freezes at
mount. If your build enables
`babel-plugin-react-compiler` and you render custom cells or headers, read
state reactively instead: `table.state.<slice>` where you have the table
instance, or a `Subscribe` boundary from `@tanstack/react-table` where you
only have a row, cell, or column. Reads of row data (`row.getValue`,
`row.original`) and of static column config are safe, as is any call made
inside an event handler.
