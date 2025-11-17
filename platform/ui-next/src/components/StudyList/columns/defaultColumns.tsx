import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../DataTable';
import { Icons } from '../../Icons';
import { Button } from '../../Button';
import type { StudyRow } from '../StudyListTypes';
import { StudyListActionsCell } from '../components/StudyListActionsCell';

export function defaultColumns(): ColumnDef<StudyRow, unknown>[] {
  return [
    {
      accessorKey: 'patient',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Patient"
        />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue('patient')}</div>,
      meta: {
        label: 'Patient',
        headerClassName: 'w-[165px] min-w-[165px] max-w-[165px]',
        cellClassName: 'w-[165px] min-w-[165px] max-w-[165px]',
        fixedWidth: 165,
      },
    },
    {
      accessorKey: 'mrn',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="MRN"
        />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue('mrn')}</div>,
      meta: {
        label: 'MRN',
        headerClassName: 'w-[120px] min-w-[120px] max-w-[120px]',
        cellClassName: 'w-[120px] min-w-[120px] max-w-[120px]',
        fixedWidth: 120,
      },
    },
    {
      accessorKey: 'studyDateTime',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Study Date"
        />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue('studyDateTime')}</div>,
      sortingFn: (a, b, colId) => {
        const norm = (s: string) => new Date(s.replace(' ', 'T')).getTime() || 0;
        return norm(a.getValue(colId) as string) - norm(b.getValue(colId) as string);
      },
      meta: {
        label: 'Study Date',
        headerClassName: 'w-[150px] min-w-[150px] max-w-[150px]',
        cellClassName: 'w-[150px] min-w-[150px] max-w-[150px]',
        fixedWidth: 150,
      },
    },
    {
      accessorKey: 'modalities',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Modalities"
        />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue('modalities')}</div>,
      meta: {
        label: 'Modalities',
        headerClassName: 'w-[85px] min-w-[85px] max-w-[85px]',
        cellClassName: 'w-[85px] min-w-[85px] max-w-[85px]',
        fixedWidth: 85,
      },
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
      meta: {
        label: 'Description',
        headerClassName: 'min-w-[290px]',
        cellClassName: 'min-w-[290px]',
      },
    },
    {
      accessorKey: 'accession',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Accession"
        />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue('accession')}</div>,
      meta: {
        label: 'Accession',
        headerClassName: 'w-[140px] min-w-[140px] max-w-[140px]',
        cellClassName: 'w-[140px] min-w-[140px] max-w-[140px]',
        fixedWidth: 140,
      },
    },
    {
      accessorKey: 'instances',
      header: ({ column }) => {
        const sorted = column.getIsSorted() as false | 'asc' | 'desc';
        const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕';
        return (
          <div className="flex w-full items-center justify-end translate-x-5">
            <Icons.Series
              className="text-muted-foreground h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(sorted === 'asc')}
              aria-label="Sort by instances"
              className="px-1"
            >
              {indicator}
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue('instances') as number;
        return <div className="text-right">{value}</div>;
      },
      sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
      meta: {
        label: 'Instances',
        headerClassName: 'w-[45px] min-w-[45px] max-w-[45px]',
        cellClassName: 'w-[45px] min-w-[45px] max-w-[45px] overflow-hidden',
        fixedWidth: 45,
      },
    },
    // Non-hideable trailing actions column to keep the menu at row end
    {
      id: 'actions',
      header: () => null,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => <StudyListActionsCell row={row as any} />,
      meta: {
        // No label so it never appears labeled in any UI; also non-hideable
        headerClassName: 'w-[56px] min-w-[56px] max-w-[56px]',
        cellClassName: 'w-[56px] min-w-[56px] max-w-[56px] overflow-visible',
        fixedWidth: 56,
      },
    },
  ];
}
