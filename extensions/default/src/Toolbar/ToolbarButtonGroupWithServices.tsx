import React, { useCallback } from 'react';
import { ToolButtonSmall } from '@ohif/ui-next';
function ToolbarButtonGroupWithServices({ groupId, items, onInteraction, size }) {
  return (
    <div className="flex space-x-1">
      {items.map((item, index) => {
        // Determine if item is active from your existing logic
        const isActive = item.isActive;
        return (
          <ToolButtonSmall
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
