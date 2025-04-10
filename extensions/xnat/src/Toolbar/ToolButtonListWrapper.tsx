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
  disabledText?: string;
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
}: ToolButtonListWrapperProps) {
  return (
    <ToolButtonList>
      <ToolButtonListDefault>
        <div
          data-cy={`${groupId}-split-button-primary`}
          data-tool={primary.id}
          data-active={primary.isActive}
        >
          <ToolButton
            {...primary}
            onInteraction={({ itemId }) =>
              onInteraction?.({ groupId, itemId, commands: primary.commands })
            }
            className={primary.className}
          />
        </div>
      </ToolButtonListDefault>
      <ToolButtonListDivider className={primary.isActive ? 'opacity-0' : 'opacity-100'} />
      <div data-cy={`${groupId}-split-button-secondary`}>
        <ToolButtonListDropDown>
          {items.map(item => (
            <ToolButtonListItem
              key={item.id}
              {...item}
              data-cy={item.id}
              data-tool={item.id}
              data-active={item.isActive}
              onSelect={() =>
                onInteraction?.({ groupId, itemId: item.id, commands: item.commands })
              }
            >
              <span className="pl-1">{item.label || item.tooltip || item.id}</span>
            </ToolButtonListItem>
          ))}
        </ToolButtonListDropDown>
      </div>
    </ToolButtonList>
  );
}
