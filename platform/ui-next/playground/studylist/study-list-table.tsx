import * as React from 'react'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import {
  DataTable,
  DataTableToolbar,
  DataTableTitle,
  DataTableFilterRow,
  DataTableViewOptions,
  useDataTable,
} from '../../src/components/DataTable'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../src/components/Table'
import { ScrollArea } from '../../src/components/ScrollArea'
import type { StudyRow } from './types'
import ohifLogo from './assets/ohif-logo.svg'

type Props = {
  columns: ColumnDef<StudyRow, unknown>[]
  data: StudyRow[]
  title?: React.ReactNode
  getRowId?: (row: StudyRow, index: number) => string
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
  enforceSingleSelection?: boolean
  showColumnVisibility?: boolean
  tableClassName?: string
  onSelectionChange?: (rows: StudyRow[]) => void
}

export function StudyListTable({
  columns,
  data,
  title,
  getRowId,
  initialSorting = [],
  initialVisibility = {},
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onSelectionChange,
}: Props) {
  return (
    <DataTable<StudyRow>
      data={data}
      columns={columns}
      getRowId={getRowId}
      initialSorting={initialSorting}
      initialVisibility={initialVisibility}
      enforceSingleSelection={enforceSingleSelection}
      onSelectionChange={onSelectionChange}
    >
      <Content title={title} showColumnVisibility={showColumnVisibility} tableClassName={tableClassName} />
    </DataTable>
  )
}

function Content({
  title,
  showColumnVisibility,
  tableClassName,
}: {
  title?: React.ReactNode
  showColumnVisibility?: boolean
  tableClassName?: string
}) {
  const { table, setColumnFilters } = useDataTable<StudyRow>()
  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <DataTableToolbar>
          <div className="absolute left-0">
            <img src={ohifLogo} alt="OHIF Logo" width={232} height={22} className="h-[22px] w-[232px]" />
          </div>
          {title ? <DataTableTitle>{title}</DataTableTitle> : null}
          {showColumnVisibility && (
            <div className="absolute right-0">
              <DataTableViewOptions
                getLabel={(id) => {
                  const label = (table.getColumn(id)?.columnDef.meta as { label?: string } | undefined)?.label
                  return label ?? id
                }}
              />
            </div>
          )}
        </DataTableToolbar>
      )}
      <div className="border-input/50 min-h-0 flex-1 rounded-md border">
        <ScrollArea className="h-full">
          <Table className={tableClassName} containerClassName="h-full" noScroll>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="bg-muted sticky top-0 z-10"
                      aria-sort={(() => {
                        const s = header.column.getIsSorted() as false | 'asc' | 'desc'
                        return s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none'
                      })()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <DataTableFilterRow resetCellId="instances" onReset={() => setColumnFilters([])} excludeColumnIds={[]} />
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={() => row.toggleSelected()}
                    aria-selected={row.getIsSelected()}
                    className="group cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}
