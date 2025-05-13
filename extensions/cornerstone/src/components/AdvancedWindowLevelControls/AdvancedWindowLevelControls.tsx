import { useToolbar } from '@ohif/core/src/hooks/useToolbar';
import React from 'react';

function AdvancedWindowLevelControls({
  viewportId,
  location,
}: {
  viewportId: string;
  location: number;
}) {
  const {
    onInteraction,
    toolbarButtons,
    isItemOpen,
    isItemLocked,
    openItem,
    closeItem,
    toggleLock,
  } = useToolbar({
    buttonSection: 'advancedWindowLevelControls',
  });

  if (!toolbarButtons?.length) {
    return null;
  }

  return (
    <div className="flex flex-row gap-2">
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

        return <div key={id}>{tool}</div>;
      })}
    </div>
  );
}

export default AdvancedWindowLevelControls;
