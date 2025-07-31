import React from 'react';
import Typography from '../Typography';
import { Icons } from '@ohif/ui-next';

interface ContextMenuProps {
  defaultPosition?: {
    x?: number;
    y?: number;
  };
  items?: {
    label: string;
    action(...args: unknown[]): unknown;
  }[];
}

const ContextMenu = ({
  items,
  ...props
}: ContextMenuProps) => {
  if (!items) {
    return null;
  }

  return (
    <div
      data-cy="context-menu"
      className="bg-secondary-dark relative z-50 block w-48 rounded"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          data-cy="context-menu-item"
          onClick={() => item.action(item, props)}
          style={{ justifyContent: 'space-between' }}
          className="hover:bg-primary-dark border-primary-dark flex cursor-pointer items-center border-b px-4 py-3 transition duration-300 last:border-b-0"
        >
          <Typography>{item.label}</Typography>
          {item.iconRight && (
            <Icons.ByName
              name={item.iconRight}
              className="inline text-white"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
