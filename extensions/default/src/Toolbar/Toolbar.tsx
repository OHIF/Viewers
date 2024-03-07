import React from 'react';
import { Tooltip } from '@ohif/ui';
import classnames from 'classnames';
import { useToolbar } from '@ohif/core';

export function Toolbar({ servicesManager }) {
  const { toolbarButtons, onInteraction } = useToolbar({
    servicesManager,
    buttonSection: 'primary',
  });

  if (!toolbarButtons.length) {
    return null;
  }

  return (
    <>
      {toolbarButtons.map(toolDef => {
        if (!toolDef) {
          return null;
        }

        const { id, Component, componentProps } = toolDef;
        const { disabled } = componentProps;

        const tool = (
          <Component
            key={id}
            id={id}
            onInteraction={onInteraction}
            servicesManager={servicesManager}
            {...componentProps}
          />
        );

        return disabled ? (
          <Tooltip
            key={id}
            position="bottom"
            content={
              <>
                {componentProps.label}
                <div className="text-xs text-white">
                  Tool not available for current Active viewport
                </div>
              </>
            }
          >
            <div className={classnames('mr-1')}>{tool}</div>
          </Tooltip>
        ) : (
          <div
            key={id}
            className="mr-1"
          >
            {tool}
          </div>
        );
      })}
    </>
  );
}
