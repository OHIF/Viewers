import React from 'react';
import {
  ToolButtonList,
  ToolButton,
  ToolButtonListDefault,
  ToolButtonListDropDown,
  ToolButtonListItem,
} from '@ohif/ui-next';

interface ButtonItem {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  commands?: Record<string, unknown>;
  disabled?: boolean;
}

interface ToolButtonListWrapperProps {
  groupId: string;
  primary: ButtonItem;
  items: ButtonItem[];
  onInteraction?: (details: {
    groupId: string;
    itemId: string;
    commands?: Record<string, unknown>;
  }) => void;
}

/**
 * Wraps the ToolButtonList component to handle the OHIF toolbar button structure
 * @param props - Component props
 * @returns Component
 */
export default function ToolButtonListWrapper({
  groupId,
  primary,
  items,
  onInteraction,
}: ToolButtonListWrapperProps) {
  const handleInteraction = (itemId: string, commands?: Record<string, unknown>) => {
    onInteraction?.({
      groupId,
      itemId,
      commands,
    });
  };

  return (
    <ToolButtonList>
      <ToolButtonListDefault>
        <ToolButton
          id={primary.id}
          icon={primary.icon}
          label={primary.label}
          tooltip={primary.tooltip}
          disabled={primary.disabled}
          onInteraction={({ itemId }) => handleInteraction(itemId, primary.commands)}
        />
      </ToolButtonListDefault>
      <ToolButtonListDropDown>
        {items.map(item => (
          <ToolButtonListItem
            key={item.id}
            icon={item.icon}
            disabled={item.disabled}
            onSelect={() => handleInteraction(item.id, item.commands)}
          >
            {item.label || item.tooltip || item.id}
          </ToolButtonListItem>
        ))}
      </ToolButtonListDropDown>
    </ToolButtonList>
  );
}
