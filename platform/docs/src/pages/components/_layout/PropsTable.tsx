import React from 'react';

export interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}

interface PropsTableProps {
  props: PropDef[];
}

export default function PropsTable({ props }: PropsTableProps) {
  const {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
  } = require('../../../../../ui-next/src/components/Table');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground font-medium">Prop</TableHead>
          <TableHead className="text-foreground font-medium">Type</TableHead>
          <TableHead className="text-foreground font-medium">Default</TableHead>
          <TableHead className="text-foreground font-medium">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.map(prop => (
          <TableRow key={prop.name}>
            <TableCell className="font-mono text-base text-foreground">{prop.name}</TableCell>
            <TableCell className="font-mono text-base">{prop.type}</TableCell>
            <TableCell className="font-mono text-base">{prop.default}</TableCell>
            <TableCell>{prop.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
