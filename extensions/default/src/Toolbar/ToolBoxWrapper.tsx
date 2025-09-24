import React from 'react';
import classNames from 'classnames';
import { ToolButton } from '@ohif/ui-next';
import { useToolbar } from '@ohif/core/src/hooks/useToolbar';

/**
 * Wraps the ToolButtonList component to handle the OHIF toolbar button structure
 * @param props - Component props
 * @returns Component
 */
export function ToolBoxButtonGroupWrapper({ buttonSection, id }) {
  const { onInteraction, toolbarButtons } = useToolbar({
    buttonSection,
  });

  if (!buttonSection) {
    return null;
  }

  const items = toolbarButtons.map(button => button.componentProps);

  return (
    <div className="bg-popover flex flex-row space-x-1 rounded-md px-0 py-0">
      {items.map(item => (
        <ToolButton
          {...item}
          key={item.id}
          size="small"
          className={item.disabled && 'text-foreground/70'}
          onInteraction={event => {
            onInteraction?.({
              event,
              id,
              commands: item.commands,
              itemId: item.id,
              item,
            });
          }}
        />
      ))}
    </div>
  );
}

export function ToolBoxButtonWrapper({ onInteraction, className, options, ...props }) {
  return (
    <div className="bg-popover flex flex-row rounded-md px-0 py-0">
      <ToolButton
        {...props}
        id={props.id}
        size="small"
        className={classNames(props.disabled && 'text-foreground/70', className)}
        onInteraction={event => {
          onInteraction?.({
            event,
            itemId: props.id,
            commands: props.commands,
            options,
          });
        }}
      />
    </div>
  );
}
