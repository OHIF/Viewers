import { ToolbarButton, ButtonGroup } from '@ohif/ui';
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

  return <ButtonGroup>{getSplitButtonItems(items)}</ButtonGroup>;
}

export default ToolbarButtonGroupWithServices;
