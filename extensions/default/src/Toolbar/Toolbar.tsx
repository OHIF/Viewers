import React from 'react';
import { useToolbar } from '@ohif/core';

export function Toolbar({ buttonSection = 'primary' }) {
  const { toolbarButtons, onInteraction } = useToolbar({
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
        const tool = (
          <Component
            key={id}
            id={id}
            onInteraction={onInteraction}
            {...componentProps}
          />
        );

        return <div key={id}>{tool}</div>;
      })}
    </>
  );
}
