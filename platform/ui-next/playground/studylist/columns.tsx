import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '../../src/components/DataTable'
import { LaunchMenuCell } from './cells/launch-menu-cell'
import type { StudyRow } from './types'

export const studyListColumns: ColumnDef<StudyRow, unknown>[] = [
  {
    accessorKey: 'patient',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('patient')}</div>,
    meta: { label: 'Patient' },
  },
  {
    accessorKey: 'mrn',
    header: ({ column }) => <DataTableColumnHeader column={column} title="MRN" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('mrn')}</div>,
    meta: { label: 'MRN' },
  },
  {
    accessorKey: 'studyDateTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Study Date" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('studyDateTime')}</div>,
    sortingFn: (a, b, colId) => {
      const norm = (s: string) => new Date(s.replace(' ', 'T')).getTime() || 0
      return norm(a.getValue(colId) as string) - norm(b.getValue(colId) as string)
    },
    meta: { label: 'Study Date' },
  },
  {
    accessorKey: 'modalities',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Modalities" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('modalities')}</div>,
    meta: { label: 'Modalities' },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <div>{row.getValue('description')}</div>,
    meta: { label: 'Description' },
  },
  {
    accessorKey: 'accession',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Accession" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('accession')}</div>,
    meta: { label: 'Accession' },
  },
  {
    accessorKey: 'instances',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Instances" align="right" />,
    cell: ({ row }) => {
      const value = row.getValue('instances') as number
      return <LaunchMenuCell row={row} value={value} />
    },
    sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
    meta: { label: 'Instances' },
  },
]
