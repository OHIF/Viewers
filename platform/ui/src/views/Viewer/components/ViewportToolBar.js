import React, { useState } from 'react';
import classnames from 'classnames';

import { Icon, IconButton } from '@ohif/ui';

const ViewportToolbar = () => {
  const [activeTool, setActiveTool] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const tools = [
    {
      id: 'Annotate',
      label: 'Annotate',
      icon: 'tool-annotate',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Annotate' },
    },
    {
      id: 'Bidirectional',
      label: 'Bidirectional',
      icon: 'tool-bidirectional',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Bidirectional' },
    },
    {
      id: 'Elipse',
      label: 'Elipse',
      icon: 'tool-elipse',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Elipse' },
    },
    {
      id: 'Length',
      label: 'Length',
      icon: 'tool-length',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
    },
  ];
  const renderToolbar = () => {
    return tools.map((tool, i) => {
      const isActive = activeTool === tool.id;
      const shouldShowTooltip = showTooltip === tool.id;
      return (
        <div className="relative flex justify-center" key={tool.id}>
          <IconButton
            variant={isActive ? 'contained' : 'text'}
            className={classnames('mx-1', {
              'text-black': isActive,
              'text-white hover:bg-secondary-dark hover:text-white focus:bg-secondary-dark focus:text-white': !isActive,
            })}
            onClick={(e) => {
              setActiveTool(tool.id);
            }}
            onMouseOver={() => setShowTooltip(tool.id)}
            onMouseOut={() => setShowTooltip(null)}
          >
            <Icon name={tool.icon} />
          </IconButton>
          {shouldShowTooltip && (
            <div
              className={classnames(
                'tooltip absolute bg-primary-dark border border-secondary-main text-white text-base rounded py-1 px-4 inset-x-auto top-full mt-2 w-max-content'
              )}
            >
              {tool.label}
              <svg
                className="absolute text-primary-dark w-full h-4 left-0 stroke-secondary-main"
                style={{ top: -15 }}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path fill="currentColor" d="M24 22h-24l12-20z" />
              </svg>
            </div>
          )}
        </div>
      );
    });
  };
  return (
    <div
      className={classnames(
        'flex w-full items-center bg-primary-dark px-3 py-2'
      )}
    >
      <div className="flex items-center">{renderToolbar()}</div>
    </div>
  );
};

export default ViewportToolbar;
