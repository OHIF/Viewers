import React from 'react';
import { useToolbar } from '@ohif/core';

/**
 * Props for the Toolbar component that renders a collection of toolbar buttons.
 *
 * @interface ToolbarProps
 */
interface ToolbarProps {
  /**
   * The section of buttons to display in the toolbar.
   * Common values include 'primary', 'secondary', 'tertiary', etc.
   * Defaults to 'primary' if not specified.
   *
   * @default 'primary'
   */
  buttonSection?: string;

  /**
   * The unique identifier of the viewport this toolbar is associated with.
   */
  viewportId?: string;

  /**
   * The numeric position or location of the toolbar.
   * Used for ordering and layout purposes in the UI.
   */
  location?: number;

  /**
   * Array of button IDs that should be visible in the toolbar.
   * If provided, only buttons whose IDs are in this array will be rendered.
   * If not provided, all buttons for the specified buttonSection will be shown.
   * Note that although the name of this prop refers to button ids, it
   * applies to any subcomponent of the toolbar.
   */
  visibleButtonIds?: string[];
}

export function Toolbar({
  buttonSection = 'primary',
  viewportId,
  location,
  visibleButtonIds,
}: ToolbarProps) {
  const {
    toolbarButtons,
    onInteraction,
    isItemOpen,
    isItemLocked,
    openItem,
    closeItem,
    toggleLock,
  } = useToolbar({
    buttonSection,
  });

  if (!toolbarButtons.length) {
    return null;
  }

  const visibleToolbarButtons = visibleButtonIds
    ? toolbarButtons?.filter(button =>
        visibleButtonIds.includes(button.componentProps.buttonSection)
      )
    : toolbarButtons;

  return (
    <>
      {visibleToolbarButtons?.map(toolDef => {
        if (!toolDef) {
          return null;
        }

        const { id, Component, componentProps } = toolDef;

        // Enhanced props with state and actions - respecting viewport specificity
        const enhancedProps = {
          ...componentProps,
          isOpen: isItemOpen(id, viewportId),
          isLocked: isItemLocked(id, viewportId),
          onOpen: () => openItem(id, viewportId),
          onClose: () => closeItem(id, viewportId),
          onToggleLock: () => toggleLock(id, viewportId),
          viewportId,
        };

        const tool = (
          <Component
            key={id}
            id={id}
            location={location}
            onInteraction={args => {
              onInteraction({
                ...args,
                itemId: id,
                viewportId,
              });
            }}
            {...enhancedProps}
          />
        );

        return (
          <div
            key={id}
            // This wrapper div exists solely for React's key prop requirement during reconciliation.
            // We use display:contents to make it transparent to the layout engine (children appear
            // as direct children of the parent) while keeping it in the DOM for React's virtual DOM.
            className="contents"
          >
            {tool}
          </div>
        );
      })}
    </>
  );
}
