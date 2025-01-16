import { ToolbarButton, ButtonGroup } from '@ohif/ui';
import { ToolButtonSmall } from '@ohif/ui-next';
import React, { useCallback } from 'react';

function ToolbarButtonGroupWithServices({ groupId, items, onInteraction, size }) {
  const getSplitButtonItems = useCallback(
    items =>
      items.map((item, index) => (
        <ToolbarButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          disabled={item.disabled}
          className={item.className}
          disabledText={item.disabledText}
          id={item.id}
          size={size}
          onClick={() => {
            onInteraction({
              groupId,
              itemId: item.id,
              commands: item.commands,
            });
          }}
          // Note: this is necessary since tooltip will add
          // default styles to the tooltip container which
          // we don't want for groups
          toolTipClassName=""
        />
      )),
    [onInteraction, groupId]
  );

  return (
    <div className="flex space-x-2">
      {items.map(item => (
        <ToolButtonSmall
          key={item.id}
          id={item.id}
          icon={item.icon}
          label={item.label}
          tooltip={item.label} // or item.tooltip if you have one
          isActive={item.active} // or however you track "active"
          disabled={item.disabled}
          commands={item.commands}
          onInteraction={({ itemId, commands }) => {
            onInteraction({
              groupId,
              itemId,
              commands,
            });
          }}
        />
      ))}
    </div>
  );
}

export default ToolbarButtonGroupWithServices;
