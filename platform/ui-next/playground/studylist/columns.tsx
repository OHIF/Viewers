import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ColumnHeader } from './column-header'
import { LaunchMenuCell } from './cells/launch-menu-cell'
import type { StudyRow } from './types'

export const studyListColumns: ColumnDef<StudyRow, unknown>[] = [
  {
    accessorKey: 'patient',
    header: ({ column }) => <ColumnHeader column={column} title="Patient" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('patient')}</div>,
  },
  {
    accessorKey: 'mrn',
    header: ({ column }) => <ColumnHeader column={column} title="MRN" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('mrn')}</div>,
  },
  {
    accessorKey: 'studyDateTime',
    header: ({ column }) => <ColumnHeader column={column} title="Study Date" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('studyDateTime')}</div>,
    sortingFn: (a, b, colId) =>
      new Date(a.getValue(colId) as string).getTime() -
      new Date(b.getValue(colId) as string).getTime(),
  },
  {
    accessorKey: 'modalities',
    header: ({ column }) => <ColumnHeader column={column} title="Modalities" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('modalities')}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <ColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <div>{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'accession',
    header: ({ column }) => <ColumnHeader column={column} title="Accession" />,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('accession')}</div>,
  },
  {
    accessorKey: 'instances',
    header: ({ column }) => <ColumnHeader column={column} title="Instances" align="right" />,
    cell: ({ row }) => {
      const value = row.getValue('instances') as number
      return <LaunchMenuCell row={row} value={value} />
    },
    sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
  },
]

