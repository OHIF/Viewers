import React from 'react';
import PropTypes from 'prop-types';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const StudyContextMenu = ({ children, content }) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{children}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Content
        className="bg-secondary-dark border-secondary-light z-50 min-w-[150px] rounded-md border p-1 text-white shadow-lg"
        sideOffset={5}
        align="start"
      >
        {content}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
};

StudyContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
};

const ContextMenuItem = ({ children, onClick, icon }) => {
  return (
    <DropdownMenuPrimitive.Item
      className="hover:bg-primary-dark focus:bg-primary-dark flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
      onClick={onClick}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
    </DropdownMenuPrimitive.Item>
  );
};

ContextMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  icon: PropTypes.node,
};

const ContextMenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="bg-secondary-light my-1 h-px" />
);

export { StudyContextMenu, ContextMenuItem, ContextMenuSeparator };
