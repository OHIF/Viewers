import React from 'react';
import { ToolButtonGroup } from '@ohif/ui-next';

function ToolbarButtonGroupWithServices({
  groupId,
  items,
  onInteraction,
}: {
  groupId: string;
  items: any[];
  onInteraction: any;
}) {
  return (
    <div className="flex space-x-1">
      {items?.map((item, index) => {
        const isActive = item.isActive;
        return (
          <ToolButtonGroup
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
            disabled={item.disabled}
            onClick={() => {
              onInteraction({ groupId, itemId: item.id, commands: item.commands });
            }}
          />
        );
      })}
    </div>
  );
}

export default ToolbarButtonGroupWithServices;
