import React, { useState } from 'react';
import classnames from 'classnames';
import { NavBar, Svg, Icon, IconButton } from '@ohif/ui';

const Header = () => {
  const [activeTool, setActiveTool] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const tools = [
    {
      id: 'Zoom',
      label: 'Zoom',
      icon: 'tool-zoom',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
    },
    {
      id: 'Wwwc',
      label: 'Levels',
      icon: 'tool-window-level',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Wwwc' },
    },
    {
      id: 'Pan',
      label: 'Pan',
      icon: 'tool-move',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
    },
    {
      id: 'Capture',
      label: 'Capture',
      icon: 'tool-capture',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Capture' },
    },
    {
      id: 'Layout',
      label: 'Layout',
      icon: 'tool-layout',
      type: null,
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Layout' },
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
              'text-common-bright hover:bg-primary-dark hover:text-primary-light': !isActive,
            })}
            onClick={(e) => {
              setActiveTool(tool.id);
            }}
            onMouseOver={() => setShowTooltip(tool.id)}
            onMouseOut={() => setShowTooltip(null)}
            key={tool.id}
          >
            <Icon name={tool.icon} />
          </IconButton>
          {shouldShowTooltip && (
            <div
              className={classnames(
                'tooltip tooltip-up absolute bg-primary-dark border border-secondary-main text-white text-base rounded py-1 px-4 inset-x-auto top-full mt-2 w-max-content'
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
    <NavBar className="justify-between border-b-4 border-black">
      <div className="flex flex-1 justify-between">
        <div className="flex items-center">
          <div className="mr-3 inline-flex items-center">
            <Icon
              name="chevron-left"
              className="text-primary-active w-8 cursor-pointer"
              onClick={() => alert('Navigate to previous page')}
            />
            <a href="#" className="ml-4">
              <Svg name="logo-ohif" />
            </a>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center">
            {renderToolbar()}
            <span className="w-1 border-l py-4 mx-2 border-common-dark" />
            <IconButton
              className={classnames(
                'mx-1 text-common-bright hover:bg-primary-dark hover:text-primary-light'
              )}
              color="inherit"
              onClick={(e) => {
                alert('Open menu');
              }}
            >
              <Icon name="tool-more-menu" />
            </IconButton>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-common-light text-lg">
            FOR INVESTIGATIONAL USE ONLY
          </span>
          <IconButton
            variant="text"
            color="inherit"
            className="text-primary-active"
            onClick={() => {}}
          >
            <React.Fragment>
              <Icon name="settings" /> <Icon name="chevron-down" />
            </React.Fragment>
          </IconButton>
        </div>
      </div>
    </NavBar>
  );
};

export default Header;
