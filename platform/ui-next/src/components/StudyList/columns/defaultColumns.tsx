import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../DataTable';
import { Icons } from '../../Icons';
import type { StudyRow } from '../types/StudyListTypes';
import { StudyListActionsCell } from '../components/StudyListActionsCell';
import { tokenizeModalities } from '../utils/tokenizeModalities';
import { formatStudyDate, parseStudyDateTimestamp } from '../utils/formatStudyDate';

export function defaultColumns(): ColumnDef<StudyRow, unknown>[] {
  return [
    {
      id: 'patient',
      accessorFn: row => {
        const r = row as StudyRow;
        return r.patientName ?? '';
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('patient')}</div>,
      meta: {
        label: 'Patient',
        headerClassName: 'min-w-[165px]',
        cellClassName: 'min-w-[165px]',
        minWidth: 165,
      },
    },
    {
      id: 'mrn',
      accessorFn: row => {
        const r = row as StudyRow;
        return r.mrn ?? '';
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('mrn')}</div>,
      meta: {
        label: 'MRN',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'min-w-[120px]',
        minWidth: 120,
      },
    },
    {
      id: 'studyDateTime',
      accessorFn: row => {
        const r = row as StudyRow;
        return formatStudyDate(r.date ?? '', r.time ?? '');
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => {
        return <div className="truncate">{row.getValue('studyDateTime')}</div>;
      },
      sortingFn: (a, b) => {
        const aRow = a.original as StudyRow;
        const bRow = b.original as StudyRow;
        const aTimestamp = parseStudyDateTimestamp(aRow.date ?? '', aRow.time ?? '');
        const bTimestamp = parseStudyDateTimestamp(bRow.date ?? '', bRow.time ?? '');
        return aTimestamp - bTimestamp;
      },
      meta: {
        label: 'Study Date',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px]',
        minWidth: 150,
      },
    },
    {
      id: 'modalities',
      accessorFn: row => {
        const r = row as StudyRow;
        return r.modalities ?? '';
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('modalities')}</div>,
      filterFn: (row, colId, filter) => {
        const selected = Array.isArray(filter) ? (filter as string[]) : [];
        if (!selected.length) {
          return true;
        }
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
      id: 'description',
      accessorFn: row => {
        const r = row as StudyRow;
        return r.description ?? '';
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        return (
          <div className={!description ? 'text-muted-foreground/40' : ''}>
            {description || 'No Description'}
          </div>
        );
      },
      meta: {
        label: 'Description',
        headerClassName: 'min-w-[290px]',
        cellClassName: 'min-w-[290px]',
        minWidth: 290,
      },
    },
    {
      id: 'accession',
      accessorFn: row => {
        const r = row as StudyRow;
        return r.accession ?? '';
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => <div className="truncate">{row.getValue('accession')}</div>,
      meta: {
        label: 'Accession',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px]',
        minWidth: 140,
      },
    },
    {
      id: 'instances',
      accessorFn: row => {
        const r = row as StudyRow;
        return Number(r.instances ?? 0);
      },
      header: ({ column }) => <DataTable.ColumnHeader column={column} />,
      cell: ({ row }) => {
        const value = row.getValue('instances') as number;
        return <div className="text-right">{value}</div>;
      },
      sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
      meta: {
        label: 'Instances',
        headerContent: (
          <Icons.Series
            className="text-muted-foreground h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        ),
        align: 'right',
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
      cell: ({ cell }) => <StudyListActionsCell cell={cell} />,
      meta: {
        // No label so it never appears labeled in any UI; also non-hideable
        headerClassName: 'w-[56px] min-w-[56px] max-w-[56px]',
        cellClassName: 'w-[56px] min-w-[56px] max-w-[56px] overflow-visible',
        minWidth: 56,
      },
    },
  ];
}
