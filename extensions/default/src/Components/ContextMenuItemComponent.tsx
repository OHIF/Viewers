import React from 'react';
import { Typography } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';

/**
 *  A React component that renders a context menu item.
 */
const ContextMenuItemComponent = ({ index, item, ...props }) => {
  return (
    <div
      key={index}
      data-cy="context-menu-item"
      onClick={() => item.action(item, props)}
      style={{ justifyContent: 'space-between' }}
      className="hover:bg-primary-dark border-primary-dark flex cursor-pointer items-center border-b px-4 py-3 transition duration-300 last:border-b-0"
    >
      <Typography>{item.label}</Typography>
      {item.iconRight && (
        <Icon
          name={item.iconRight}
          className="inline"
        />
      )}
    </div>
  );
};

export default ContextMenuItemComponent;
