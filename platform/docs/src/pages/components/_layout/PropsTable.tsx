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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="text-foreground pb-2 pr-4 font-medium">Prop</th>
            <th className="text-foreground pb-2 pr-4 font-medium">Type</th>
            <th className="text-foreground pb-2 pr-4 font-medium">Default</th>
            <th className="text-foreground pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="text-secondary-foreground">
          {props.map((prop, i) => (
            <tr
              key={prop.name}
              className={i < props.length - 1 ? 'border-b border-border/50' : ''}
            >
              <td className="py-2 pr-4 font-mono text-base text-foreground">{prop.name}</td>
              <td className="py-2 pr-4 font-mono text-base">{prop.type}</td>
              <td className="py-2 pr-4 font-mono text-base">{prop.default}</td>
              <td className="py-2">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
