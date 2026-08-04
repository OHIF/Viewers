import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function DataTablePageContent() {
  const { DataTable } = require('../../../../ui-next/src/components/DataTable');
  const {
    Table: BasicTable,
    TableHeader: BasicTableHeader,
    TableBody: BasicTableBody,
    TableHead: BasicTableHead,
    TableRow: BasicTableRow,
    TableCell: BasicTableCell,
  } = require('../../../../ui-next/src/components/Table');
  const { TooltipProvider } = require('../../../../ui-next/src/components/Tooltip');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [filters, setFilters] = useState([]);

  const studies = [
    { studyInstanceUid: '1.2.840.1', patientName: 'Smith, John', mrn: '12345678', modality: 'CT', date: 'Mar 15, 2024', description: 'CT Chest with Contrast', instances: 245 },
    { studyInstanceUid: '1.2.840.2', patientName: 'Doe, Jane', mrn: '23456789', modality: 'MR', date: 'Mar 14, 2024', description: 'MR Brain without Contrast', instances: 186 },
    { studyInstanceUid: '1.2.840.3', patientName: 'Lee, Alex', mrn: '34567890', modality: 'CT', date: 'Mar 14, 2024', description: 'CT Abdomen/Pelvis', instances: 312 },
    { studyInstanceUid: '1.2.840.4', patientName: 'Garcia, Maria', mrn: '45678901', modality: 'PET/CT', date: 'Mar 13, 2024', description: 'PET/CT Whole Body', instances: 1024 },
    { studyInstanceUid: '1.2.840.5', patientName: 'Brown, Robert', mrn: '56789012', modality: 'MR', date: 'Mar 12, 2024', description: 'MR Knee Left', instances: 92 },
    { studyInstanceUid: '1.2.840.6', patientName: 'Wilson, Emily', mrn: '67890123', modality: 'CT', date: 'Mar 11, 2024', description: 'CT Head without Contrast', instances: 156 },
    { studyInstanceUid: '1.2.840.7', patientName: 'Chen, Wei', mrn: '78901234', modality: 'US', date: 'Mar 10, 2024', description: 'US Abdomen Complete', instances: 48 },
    { studyInstanceUid: '1.2.840.8', patientName: 'Johnson, Sarah', mrn: '89012345', modality: 'MR', date: 'Mar 09, 2024', description: 'MR Lumbar Spine', instances: 220 },
  ];

  const columns = [
    {
      id: 'patientName',
      accessorFn: row => row.patientName,
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('patientName')}</div>,
      meta: { label: 'Patient', minWidth: 160, priority: 100 },
    },
    {
      id: 'mrn',
      accessorFn: row => row.mrn,
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('mrn')}</div>,
      meta: { label: 'MRN', minWidth: 110, priority: 20 },
    },
    {
      id: 'date',
      accessorFn: row => row.date,
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('date')}</div>,
      meta: { label: 'Study Date', minWidth: 130, priority: 70 },
    },
    {
      id: 'modality',
      accessorFn: row => row.modality,
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('modality')}</div>,
      meta: { label: 'Modality', minWidth: 90, priority: 60 },
    },
    {
      id: 'description',
      accessorFn: row => row.description,
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => {
        const desc = row.getValue('description');
        return (
          <div className={!desc ? 'text-muted-foreground/40' : 'truncate'}>
            {desc || 'No Description'}
          </div>
        );
      },
      meta: { label: 'Description', minWidth: 200, priority: 90 },
    },
    {
      id: 'instances',
      accessorFn: row => Number(row.instances),
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="text-right">{row.getValue('instances')}</div>,
      sortingFn: (a, b) => a.getValue('instances') - b.getValue('instances'),
      meta: { label: 'Instances', align: 'right', minWidth: 80, priority: 50 },
    },
  ];

  const simpleColumns = [
    {
      accessorKey: 'patientName',
      header: 'Patient',
      meta: { label: 'Patient' },
    },
    {
      accessorKey: 'modality',
      header: 'Modality',
      meta: { label: 'Modality' },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      meta: { label: 'Date' },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      meta: { label: 'Description' },
    },
  ];

  const dataTableProps = [
    { name: 'data', type: 'TData[]', default: '—', description: 'Array of data objects to display in the table' },
    { name: 'columns', type: 'ColumnDef<TData>[]', default: '—', description: 'TanStack React Table column definitions' },
    { name: 'getRowId', type: '(row, index) => string', default: '—', description: 'Custom row ID resolver (defaults to row index)' },
    { name: 'initialVisibility', type: 'VisibilityState', default: '{}', description: 'Initial column visibility state' },
    { name: 'sorting', type: 'SortingState', default: '[]', description: 'Controlled sorting state' },
    { name: 'pagination', type: 'PaginationState', default: '{pageIndex: 0, pageSize: 50}', description: 'Controlled pagination state' },
    { name: 'filters', type: 'ColumnFiltersState', default: '[]', description: 'Controlled column filter state' },
    { name: 'onSortingChange', type: '(updater) => void', default: '—', description: 'Called when sorting changes' },
    { name: 'onPaginationChange', type: '(updater) => void', default: '—', description: 'Called when page or page size changes' },
    { name: 'onFiltersChange', type: '(updater) => void', default: '—', description: 'Called when column filters change' },
    { name: 'manualFiltering', type: 'boolean', default: 'false', description: 'Disables automatic client-side filtering (use for server-side filtering)' },
    { name: 'enforceSingleSelection', type: 'boolean', default: 'true', description: 'Restricts row selection to a single row at a time' },
    { name: 'onSelectionChange', type: '(rows: TData[]) => void', default: '—', description: 'Called when the set of selected rows changes' },
  ];

  const columnMetaProps = [
    { name: 'label', type: 'string', default: '—', description: 'Column label shown in the ViewOptions dropdown and as the default header text' },
    { name: 'headerContent', type: 'ReactNode', default: '—', description: 'Custom header content that replaces the label in the column header' },
    { name: 'align', type: '"left" | "center" | "right"', default: '"left"', description: 'Content alignment for both header and body cells' },
    { name: 'headerClassName', type: 'string', default: '—', description: 'CSS class applied to the header cell' },
    { name: 'cellClassName', type: 'string', default: '—', description: 'CSS class applied to body cells in this column' },
    { name: 'minWidth', type: 'number | string', default: '—', description: 'Fixed column width (used by colgroup)' },
    { name: 'priority', type: 'number', default: '—', description: 'Responsive drop priority — columns with lower values are hidden first when the table is narrow. Columns without a priority are never auto-hidden.' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="DataTable"
        description="Compound data table with sorting, filtering, and pagination"
      >
        <PageHeader
          title="DataTable"
          description="A compound data table built on TanStack React Table with sorting, filtering, pagination, and column management."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              DataTable is a compound component built on{' '}
              <strong className="text-foreground">@tanstack/react-table</strong>. The root provider
              manages table state and exposes it via context to composable child components:{' '}
              <strong className="text-foreground">Toolbar</strong>,{' '}
              <strong className="text-foreground">Title</strong>,{' '}
              <strong className="text-foreground">Pagination</strong>,{' '}
              <strong className="text-foreground">ViewOptions</strong>,{' '}
              <strong className="text-foreground">Table</strong>,{' '}
              <strong className="text-foreground">Header</strong>,{' '}
              <strong className="text-foreground">FilterRow</strong>,{' '}
              <strong className="text-foreground">Body</strong>,{' '}
              <strong className="text-foreground">ColumnHeader</strong>, and{' '}
              <strong className="text-foreground">ActionOverlayCell</strong>.
            </p>
            <p>
              In the OHIF Viewer, DataTable powers the{' '}
              <strong className="text-foreground">Study List</strong> — the landing page where
              users browse, filter, and open studies. It supports sortable columns, per-column
              text filters, pagination, column visibility toggling, responsive column dropping,
              and row selection with action overlays. Built on top of the{' '}
              <a href="/components/table" className="text-primary hover:underline">Table</a>{' '}
              primitives.
            </p>
          </div>
        </div>

        <Section title="Examples">
          <ExampleBlock title="Study browser">
            <div className="flex flex-col">
              <DataTable
                data={studies}
                columns={columns}
                getRowId={row => row.studyInstanceUid}
                sorting={sorting}
                pagination={pagination}
                filters={filters}
                onSortingChange={setSorting}
                onPaginationChange={setPagination}
                onFiltersChange={setFilters}
                onSelectionChange={rows => {}}
              >
                <DataTable.Toolbar>
                  <DataTable.Title>Study List</DataTable.Title>
                  <div className="flex-1" />
                  <DataTable.Pagination />
                  <DataTable.ViewOptions />
                </DataTable.Toolbar>
                <DataTable.Table tableClassName="text-sm">
                  <DataTable.Header />
                  <DataTable.FilterRow excludeColumnIds={['instances']} />
                  <DataTable.Body
                    rowProps={{
                      className: 'group cursor-pointer',
                      onClick: row => row.toggleSelected(),
                    }}
                  />
                </DataTable.Table>
              </DataTable>
            </div>
          </ExampleBlock>

          <ExampleBlock title="Minimal table" last>
            <DataTable
              data={studies.slice(0, 5)}
              columns={simpleColumns}
            >
              <DataTable.Table>
                <DataTable.Header />
                <DataTable.Body />
              </DataTable.Table>
            </DataTable>
          </ExampleBlock>
        </Section>

        <Section title="Composition">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              DataTable uses a compound component pattern. The root{' '}
              <strong className="text-foreground">{'<DataTable>'}</strong> creates the TanStack table
              instance and provides it via context. Child components consume that context to render
              their piece of the UI.
            </p>
          </div>
          <div className="mt-4">
            <BasicTable>
              <BasicTableHeader>
                <BasicTableRow>
                  <BasicTableHead className="text-foreground font-medium">Sub-component</BasicTableHead>
                  <BasicTableHead className="text-foreground font-medium">Purpose</BasicTableHead>
                </BasicTableRow>
              </BasicTableHeader>
              <BasicTableBody>
                {[
                  ['DataTable.Toolbar', 'Flex container for title, pagination, and view options', 0],
                  ['DataTable.Title', 'Table heading text', 1],
                  ['DataTable.Pagination', 'Page navigation with configurable page sizes (25, 50, 100)', 1],
                  ['DataTable.ViewOptions', 'Column visibility toggle dropdown', 1],
                  ['DataTable.Table', 'Layout shell — fixed header table + scrollable body table', 0],
                  ['DataTable.Header', 'Renders column headers with sort indicators', 1],
                  ['DataTable.FilterRow', 'Row of per-column text filter inputs', 1],
                  ['DataTable.Body', 'Table rows with selection state and empty/loading states', 1],
                  ['DataTable.ColumnHeader', 'Individual column header with sort toggle button', 0],
                  ['DataTable.ActionOverlayCell', 'Cell with a value that swaps to an action overlay on hover or selection', 0],
                ].map(([name, purpose, indent]) => (
                  <BasicTableRow key={name}>
                    <BasicTableCell className="font-mono text-base text-foreground">
                      {indent ? <span className="pl-4 text-muted-foreground/60">↳ </span> : null}
                      {name}
                    </BasicTableCell>
                    <BasicTableCell>{purpose}</BasicTableCell>
                  </BasicTableRow>
                ))}
              </BasicTableBody>
            </BasicTable>
          </div>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import { DataTable } from '@ohif/ui-next';

// 1. Define your data type and mock data
const studies = [
  { uid: '1.2.840.1', patient: 'Smith, John', modality: 'CT', date: 'Mar 15, 2024' },
  // ...
];

// 2. Define columns with TanStack ColumnDef
const columns = [
  {
    id: 'patient',
    accessorFn: row => row.patient,
    header: ({ column }) => <DataTable.ColumnHeader column={column} />,
    cell: ({ row }) => <div className="truncate">{row.getValue('patient')}</div>,
    meta: { label: 'Patient', minWidth: 160, priority: 100 },
  },
  // ...more columns
];

// 3. Manage state
const [sorting, setSorting] = useState([]);
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
const [filters, setFilters] = useState([]);

// 4. Compose the table
<DataTable
  data={studies}
  columns={columns}
  getRowId={row => row.uid}
  sorting={sorting}
  pagination={pagination}
  filters={filters}
  onSortingChange={setSorting}
  onPaginationChange={setPagination}
  onFiltersChange={setFilters}
>
  <DataTable.Toolbar>
    <DataTable.Title>Studies</DataTable.Title>
    <div className="flex-1" />
    <DataTable.Pagination />
    <DataTable.ViewOptions />
  </DataTable.Toolbar>
  <DataTable.Table>
    <DataTable.Header />
    <DataTable.FilterRow />
    <DataTable.Body
      rowProps={{
        className: 'group cursor-pointer',
        onClick: row => row.toggleSelected(),
      }}
    />
  </DataTable.Table>
</DataTable>`}
          />
        </Section>

        <Section title="DataTable Props">
          <PropsTable props={dataTableProps} />
        </Section>

        <Section title="ColumnMeta">
          <div className="mb-4">
            <p className="text-secondary-foreground text-lg leading-relaxed">
              Column metadata is set via the <strong className="text-foreground">meta</strong> property
              on each TanStack column definition. It controls header labels, alignment, sizing, and
              responsive behavior.
            </p>
          </div>
          <PropsTable props={columnMetaProps} />
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function DataTablePage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <DataTablePageContent />}</BrowserOnly>
  );
}
