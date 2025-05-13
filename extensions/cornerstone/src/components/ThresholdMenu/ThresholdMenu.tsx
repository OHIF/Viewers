import React from 'react';

interface ThresholdMenuProps {
  viewportId: string;
  className?: string;
}

function ThresholdMenu({ viewportId, className }: ThresholdMenuProps) {
  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-medium">Threshold Menu</h3>
        <p className="py-4">Hello World! Threshold menu functionality will be added here.</p>
      </div>
    </div>
  );
}

export default ThresholdMenu;