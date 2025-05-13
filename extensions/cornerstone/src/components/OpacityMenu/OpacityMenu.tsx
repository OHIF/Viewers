import React from 'react';

interface OpacityMenuProps {
  viewportId: string;
  className?: string;
}

function OpacityMenu({ viewportId, className }: OpacityMenuProps) {
  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-medium">Opacity Menu</h3>
        <p className="py-4">Hello World! Opacity menu functionality will be added here.</p>
      </div>
    </div>
  );
}

export default OpacityMenu;