import { useToolbar, useViewportMousePosition } from '@ohif/core/src/hooks';
import React, { useState, useEffect, useRef } from 'react';
import { useViewportRendering } from '../../hooks';

function AdvancedRenderingControls({
  viewportId,
  location,
  buttonSection,
}: {
  viewportId: string;
  location: number;
  buttonSection: string;
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
    buttonSection,
  });

  const mousePosition = useViewportMousePosition(viewportId);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(true);
  const firstMountRef = useRef(true);
  const { hasColorbar } = useViewportRendering(viewportId);

  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;

      const timer = setTimeout(() => {
        setShowAllIcons(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!showAllIcons && mousePosition.isInViewport) {
      if (mousePosition.isInBottomPercentage(10)) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    }
  }, [mousePosition, showAllIcons]);

  if (!toolbarButtons?.length) {
    return null;
  }

  if (!hasColorbar) {
    return null;
  }

  return (
    <div className="flex flex-row gap-2">
      {toolbarButtons.map(toolDef => {
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

        // Always show all icons on first mount for 3 seconds
        // After that, always show Colorbar, show others only when mouse is at bottom
        const shouldBeVisible = showAllIcons || id === 'Colorbar' || isAtBottom;

        return (
          <div
            key={id}
            className={shouldBeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}
            style={{ transition: 'opacity 0.2s ease-in-out' }}
          >
            {tool}
          </div>
        );
      })}
    </div>
  );
}

export default AdvancedRenderingControls;
