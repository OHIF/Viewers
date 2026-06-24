import React from 'react';
import { Icons } from '../Icons';

interface ContextMenuViewportProps {
  items?: Array<{
    label: string;
    action: (item: any, props: any) => void;
    iconRight?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

const ContextMenuViewport = ({ items, ...props }: ContextMenuViewportProps) => {
  if (!items) {
    return null;
  }

  return (
    <div
      data-cy="context-menu"
      className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 relative z-50 w-48 overflow-hidden rounded-md border border-input p-1 shadow-md"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          data-cy="context-menu-item"
          onClick={() => item.action(item, props)}
          className="hover:bg-accent hover:text-accent-foreground flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-base outline-none"
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
