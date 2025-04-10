import React from 'react';
import classNames from 'classnames';
import { ToolButton } from '@ohif/ui-next';

/**
 * Wraps the ToolButtonList component to handle the OHIF toolbar button structure
 * @param props - Component props
 * @returns Component
 */
export function ToolBoxButtonGroupWrapper({ groupId, items, onInteraction, ...props }) {
  if (!items || !groupId) {
    return null;
  }

  return (
    <div className="bg-popover flex flex-row space-x-1 rounded-md px-0 py-0">
      {items.map(item => (
        <ToolButton
          {...item}
          key={item.id}
          size="small"
          className={props.disabled && 'text-primary'}
          onInteraction={() =>
            onInteraction?.({ groupId, itemId: item.id, commands: item.commands })
          }
        />
      ))}
    </div>
  );
}

export function ToolBoxButtonWrapper({ onInteraction, ...props }) {
  return (
    <div className="bg-popover flex flex-row rounded-md px-0 py-0">
      <ToolButton
        {...props}
        id={props.id}
        size="small"
        className={classNames(props.disabled && 'text-primary')}
        onInteraction={() => onInteraction?.({ itemId: props.id, commands: props.commands })}
      />
    </div>
  );
}
