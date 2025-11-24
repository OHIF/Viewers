import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../DataTable';
import { Icons } from '../../Icons';
import { Button } from '../../Button';
import type { StudyRow } from '../StudyListTypes';
import { StudyListActionsCell } from '../components/StudyListActionsCell';
import { tokenizeModalities } from '../../../lib/filters';

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
        headerClassName: 'min-w-[165px]',
        cellClassName: 'min-w-[165px]',
        minWidth: 165,
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
        headerClassName: 'min-w-[120px]',
        cellClassName: 'min-w-[120px]',
        minWidth: 120,
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
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px]',
        minWidth: 150,
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
      filterFn: (row, colId, filter) => {
        const selected = Array.isArray(filter) ? (filter as string[]) : [];
        if (!selected.length) return true;
        const tokens = tokenizeModalities(String(row.getValue(colId) ?? ''));
        const set = new Set(tokens);
        return selected.some(v => set.has(String(v).toUpperCase()));
      },
      meta: {
        label: 'Modalities',
        headerClassName: 'min-w-[97px]',
        cellClassName: 'min-w-[97px]',
        minWidth: 97,
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
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        return <div className={!description ? 'text-muted-foreground/40' : ''}>{description || 'No Description'}</div>;
      },
      meta: {
        label: 'Description',
        headerClassName: 'min-w-[290px]',
        cellClassName: 'min-w-[290px]',
        minWidth: 290,
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
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px]',
        minWidth: 140,
      },
    },
    {
      accessorKey: 'instances',
      header: ({ column }) => {
        const sorted = column.getIsSorted() as false | 'asc' | 'desc';
        const SortIcon = sorted === 'asc'
          ? Icons.SortingNewAscending
          : sorted === 'desc'
          ? Icons.SortingNewDescending
          : Icons.SortingNew;
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
              <SortIcon className="h-4 w-2.5" aria-hidden="true" />
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
        headerClassName: 'min-w-[45px]',
        cellClassName: 'min-w-[45px] overflow-hidden',
        minWidth: 45,
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
        minWidth: 56,
      },
    },
  ];
}
