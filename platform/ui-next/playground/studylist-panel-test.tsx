import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../src/components/Resizable';
import { ScrollArea } from '../src/components/ScrollArea';
import { Button } from '../src/components/Button';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from '../src/components/Table';
import data from './patient-studies.json';
import { PanelDefault } from './panel-default';
import { PanelContent, type StudyRow } from './panel-content';

// (moved columns/type to the top of the file)

const App = () => {
  const [layout, setLayout] = React.useState<'right' | 'bottom'>('right');
  const [selected, setSelected] = React.useState<StudyRow | null>(null);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup
          direction={layout === 'right' ? 'horizontal' : 'vertical'}
          className="h-full w-full"
        >
          {/* Main Area */}
          <ResizablePanel defaultSize={70}>
            <div className="flex h-full w-full flex-col p-3">
              <div className="min-h-0 flex-1">
                <div className="bg-background h-full rounded-md p-2">
                  {/* Data Table */}
                  <DataTable<StudyRow, unknown>
                    columns={columns}
                    data={data as StudyRow[]}
                    getRowId={row => row.accession}
                    singleRowSelection={true}
                    showColumnVisibilityControls={true}
                    title="Study List"
                    tableClassName="min-w-[1000px]"
                    onRowSelectionChange={rows => setSelected(rows[0] ?? null)}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Drag Handle */}
          <ResizableHandle />

          {/* Secondary Panel (Right or Bottom) */}
          <ResizablePanel
            defaultSize={30}
            minSize={15}
          >
            <SidePanel
              layout={layout}
              selected={selected}
              onToggleLayout={() => setLayout(layout === 'right' ? 'bottom' : 'right')}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeWrapper>
  );
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);

// Panel scaffolding to support distinct layouts for empty vs. selected states
function SidePanel({
  layout,
  selected,
  onToggleLayout,
}: {
  layout: 'right' | 'bottom';
  selected: StudyRow | null;
  onToggleLayout: () => void;
}) {
  const isRight = layout === 'right';
  const headerTitle = isRight ? 'Right Panel' : 'Bottom Panel';

  return (
    <div className="bg-background flex h-full w-full flex-col">
      <div className="bg-background text-primary flex h-10 items-center justify-between px-3 text-sm">
        <span>{headerTitle}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleLayout}
        >
          {isRight ? 'Move to Bottom' : 'Move to Right'}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 text-sm text-white/80">
          {selected ? (
            <PanelContent key={selected.accession} study={selected} layout={layout} />
          ) : (
            <PanelDefault layout={layout} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
// Types and column definitions for the study list

const columns: ColumnDef<StudyRow, unknown>[] = [
  {
    accessorKey: 'patient',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Patient"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('patient')}</div>,
  },
  {
    accessorKey: 'mrn',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="MRN"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('mrn')}</div>,
  },
  {
    accessorKey: 'studyDateTime',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Study Date and Time"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('studyDateTime')}</div>,
    sortingFn: (a, b, colId) =>
      new Date(a.getValue(colId) as string).getTime() -
      new Date(b.getValue(colId) as string).getTime(),
  },
  {
    accessorKey: 'modalities',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Modalities"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('modalities')}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
      />
    ),
    cell: ({ row }) => <div>{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'accession',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Accession Number"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('accession')}</div>,
  },
  {
    accessorKey: 'instances',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Instances"
        align="right"
      />
    ),
    cell: ({ row }) => <div className="text-right">{row.getValue('instances')}</div>,
    sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
  },
];
