import React from 'react';
import { hooks } from '@ohif/core';

const { useToolbar } = hooks;

export function Toolbar({ buttonSection = 'primary' }) {
  const {
    toolbarButtons,
    onInteraction,
    isItemOpen,
    isItemLocked,
    openItem,
    closeItem,
    closeAllItems,
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

        // Enhanced props with state and actions
        const enhancedProps = {
          ...componentProps,
          isOpen: isItemOpen(id),
          isLocked: isItemLocked(id),
          onOpen: () => openItem(id),
          onClose: () => closeItem(id),
          onToggleLock: () => toggleLock(id),
        };

        const tool = (
          <Component
            key={id}
            id={id}
            onInteraction={onInteraction}
            {...componentProps}
            {...enhancedProps}
          />
        );

        return <div key={id}>{tool}</div>;
      })}
    </>
  );
}
