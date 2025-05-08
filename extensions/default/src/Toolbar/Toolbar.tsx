import React from 'react';
import { useToolbar } from '@ohif/core';

export function Toolbar({ buttonSection = 'primary', viewportId }) {
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

  return (
    <>
      {toolbarButtons?.map(toolDef => {
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
            onInteraction={args => {
              // If the component is a menu-type button, handle open/close behavior
              if (enhancedProps.type === 'menu' || id.includes('Menu')) {
                if (isItemOpen(id, viewportId)) {
                  closeItem(id, viewportId);
                } else {
                  openItem(id, viewportId);
                }
              }

              // Add viewportId to interaction if available
              onInteraction({
                ...args,
                itemId: id,
                viewportId,
              });
            }}
            {...enhancedProps}
          />
        );

        return <div key={id}>{tool}</div>;
      })}
    </>
  );
}
