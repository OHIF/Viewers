import React from 'react';
import { Icons } from '../Icons';

interface ContextMenuViewportProps {
  items?: Array<{
    label: string;
    action: (item: any, props: any) => void;
    iconRight?: string;
    [key: string]: unknown;
  }>;
  defaultPosition?: { x: number; y: number };
  [key: string]: unknown;
}

const ContextMenuViewport = ({ items, ...props }: ContextMenuViewportProps) => {
  if (!items) {
    return null;
  }

  return (
    <div
      data-cy="context-menu"
      className="bg-popover text-popover-foreground relative z-50 block w-48 rounded border shadow-md"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          data-cy="context-menu-item"
          onClick={() => item.action(item, props)}
          className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-between border-b border-border px-4 py-3 text-sm transition duration-300 last:border-b-0"
        >
          <span>{item.label}</span>
          {item.iconRight && (
            <Icons.ByName
              name={item.iconRight}
              className="inline"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenuViewport;
