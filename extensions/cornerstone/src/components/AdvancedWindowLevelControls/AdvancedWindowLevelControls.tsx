import { useToolbar, useViewportMousePosition } from '@ohif/core/src/hooks';
import React, { useState, useEffect } from 'react';

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

  const mousePosition = useViewportMousePosition(viewportId);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (mousePosition.isInViewport) {
      if (mousePosition.isInBottomPercentage(10)) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    }
  }, [mousePosition]);

  if (!toolbarButtons?.length) {
    return null;
  }

  const renderButtons = () => {
    return toolbarButtons.map(toolDef => {
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

      // Always show Colorbar, show others only when mouse is at bottom
      const shouldBeVisible = id === 'Colorbar' || isAtBottom;

      // Apply visibility classes based on shouldBeVisible
      return (
        <div
          key={id}
          className={shouldBeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}
          style={{ transition: 'opacity 0.2s ease-in-out' }}
        >
          {tool}
        </div>
      );
    });
  };

  return <div className="flex flex-row gap-2">{renderButtons()}</div>;
}

export default AdvancedWindowLevelControls;
