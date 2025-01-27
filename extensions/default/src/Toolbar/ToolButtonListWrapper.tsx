import React from 'react';
import {
  ToolButtonList,
  ToolButton,
  ToolButtonListDefault,
  ToolButtonListDropDown,
  ToolButtonListItem,
  ToolButtonListDivider,
} from '@ohif/ui-next';

interface ButtonItem {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  commands?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
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
 * // test
 */
export default function ToolButtonListWrapper({
  groupId,
  primary,
  items,
  onInteraction,
  ...rest
}: ToolButtonListWrapperProps) {
  return (
    <ToolButtonList>
      <ToolButtonListDefault>
        <ToolButton
          id={primary.id}
          icon={primary.icon}
          isActive={primary.isActive}
          label={primary.label}
          tooltip={primary.tooltip}
          disabled={primary.disabled}
          onInteraction={({ itemId }) =>
            onInteraction?.({ groupId, itemId, commands: primary.commands })
          }
          className={primary.className}
        />
      </ToolButtonListDefault>
      <ToolButtonListDivider />
      <ToolButtonListDropDown>
        {items.map(item => (
          <ToolButtonListItem
            key={item.id}
            icon={item.icon}
            disabled={item.disabled}
            onSelect={() => onInteraction?.({ groupId, itemId: item.id, commands: item.commands })}
            className={item.className}
          >
            <span className="pl-1">{item.label || item.tooltip || item.id}</span>
          </ToolButtonListItem>
        ))}
      </ToolButtonListDropDown>
    </ToolButtonList>
  );
}
