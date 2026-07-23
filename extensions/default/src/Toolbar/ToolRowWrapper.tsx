import React from 'react';
import { useToolbar, ButtonLocation } from '@ohif/core';

interface ToolRowWrapperProps {
  buttonSection: string;
  className?: string;
  show?: boolean;
}

function ToolRowWrapper({ buttonSection, className = '', show = true }: ToolRowWrapperProps) {
  const { onInteraction, toolbarButtons } = useToolbar({
    buttonSection,
  });

  // No need for debugger statement
  if (!toolbarButtons?.length) {
    return null;
  }

  return (
    <div className={`space-x-1} flex flex-row items-center ${className}`}>
      {toolbarButtons.map((button, index) => {
        const { id, Component, componentProps } = button;
        return (
          <div
            key={id || index}
            className="flex-shrink-0"
          >
            <Component
              {...componentProps}
              onInteraction={onInteraction}
              location={componentProps.location || buttonSection}
            />
          </div>
        );
      })}
    </div>
  );
}

export default ToolRowWrapper;
