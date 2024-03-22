import { ToolbarButton, ButtonGroup } from '@ohif/ui';
import React, { useCallback } from 'react';

function ToolbarButtonGroupWithServices({ groupId, items, onInteraction }) {
  const getSplitButtonItems = useCallback(
    items =>
      items.map((item, index) => (
        <ToolbarButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          disabled={item.disabled}
          onClick={() => {
            onInteraction({
              groupId,
              itemId: item.id,
              commands: item.commands,
            });
          }}
        />
      )),
    [onInteraction, groupId]
  );

  return <ButtonGroup>{getSplitButtonItems(items)}</ButtonGroup>;
}

export default ToolbarButtonGroupWithServices;
