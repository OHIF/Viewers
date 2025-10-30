import * as React from 'react';
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import {
  DataTable,
  DataTableToolbar,
  DataTableTitle,
  DataTableFilterRow,
  DataTableViewOptions,
  useDataTable,
} from '../../src/components/DataTable';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../src/components/Table';
import { ScrollArea } from '../../src/components/ScrollArea';
import type { StudyRow } from './types';
import ohifLogo from './assets/ohif-logo.svg';
import { Button } from '../../src/components/Button';
import iconLeftBase from './assets/icon-left-base.svg';
import { StudylistTableProvider } from './components/studylist-table-context';
import type { WorkflowId } from '../../StudyList/WorkflowsInfer';

type Props = {
  columns: ColumnDef<StudyRow, unknown>[];
  data: StudyRow[];
  title?: React.ReactNode;
  getRowId?: (row: StudyRow, index: number) => string;
  initialSorting?: SortingState;
  initialVisibility?: VisibilityState;
  enforceSingleSelection?: boolean;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  onSelectionChange?: (rows: StudyRow[]) => void;
  isPanelOpen?: boolean;
  onOpenPanel?: () => void;

  /** Prototype-only: default workflow label for highlighting (DS-typed) */
  defaultMode?: WorkflowId | null;
  /** Prototype-only: centralized launcher for workflow actions (DS-typed) */
  onLaunch?: (study: StudyRow, workflow: WorkflowId) => void;
};

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
  isPanelOpen,
  onOpenPanel,
  defaultMode = null,
  onLaunch,
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
      <Content
        title={title}
        showColumnVisibility={showColumnVisibility}
        tableClassName={tableClassName}
        isPanelOpen={isPanelOpen}
        onOpenPanel={onOpenPanel}
        defaultMode={defaultMode}
        onLaunch={onLaunch}
      />
    </DataTable>
  );
}

function Content({
  title,
  showColumnVisibility,
  tableClassName,
  isPanelOpen,
  onOpenPanel,
  defaultMode = null,
  onLaunch,
}: {
  title?: React.ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  isPanelOpen?: boolean;
  onOpenPanel?: () => void;
  defaultMode?: WorkflowId | null;
  onLaunch?: (study: StudyRow, workflow: WorkflowId) => void;
}) {
  const { table, setColumnFilters } = useDataTable<StudyRow>();

  return (
    <StudylistTableProvider value={{ defaultMode: defaultMode ?? null, onLaunch }}>
      <div className="flex h-full flex-col">
        {(showColumnVisibility || title) && (
          <DataTableToolbar>
            <div className="absolute left-0">
              <img
                src={ohifLogo}
                alt="OHIF Logo"
                width={232}
                height={22}
                className="h-[22px] w-[232px]"
              />
            </div>
            {title ? <DataTableTitle>{title}</DataTableTitle> : null}
            <div className="absolute right-0 flex items-center">
              {showColumnVisibility && (
                <DataTableViewOptions
                  getLabel={(id) => {
                    const label = (
                      table.getColumn(id)?.columnDef.meta as { label?: string } | undefined
                    )?.label;
                    return label ?? id;
                  }}
                />
              )}
              {typeof onOpenPanel === 'function' && isPanelOpen === false ? (
                <div className="mt-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open preview panel"
                    onClick={onOpenPanel}
                  >
                    <img src={iconLeftBase} alt="" className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </DataTableToolbar>
        )}
        <div className="border-input/50 min-h-0 flex-1 rounded-md border">
          <ScrollArea className="h-full">
            <Table className={tableClassName} containerClassName="h-full" noScroll>
              <colgroup>
                {table.getVisibleLeafColumns().map((col) => {
                  const meta =
                    (col.columnDef.meta as unknown as { fixedWidth?: number | string } | undefined) ??
                    undefined;
                  const width = meta?.fixedWidth;
                  return width ? (
                    <col
                      key={col.id}
                      style={{ width: typeof width === 'number' ? `${width}px` : width }}
                    />
                  ) : (
                    <col key={col.id} />
                  );
                })}
              </colgroup>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={`bg-muted sticky top-0 z-10 ${
                          ((header.column.columnDef.meta as unknown as { headerClassName?: string })
                            ?.headerClassName) ?? ''
                        }`}
                        aria-sort={(() => {
                          const s = header.column.getIsSorted() as false | 'asc' | 'desc';
                          return s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none';
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
                <DataTableFilterRow
                  resetCellId="instances"
                  onReset={() => setColumnFilters([])}
                  excludeColumnIds={[]}
                />
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      onClick={() => row.toggleSelected()}
                      aria-selected={row.getIsSelected()}
                      className="group cursor-pointer"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          row.toggleSelected();
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            (
                              (cell.column.columnDef.meta as unknown as { cellClassName?: string }) ??
                              {}
                            ).cellClassName ?? ''
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
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
    </StudylistTableProvider>
  );
}
