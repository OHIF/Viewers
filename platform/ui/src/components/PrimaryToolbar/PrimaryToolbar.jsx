import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ToolbarButton, IconButton, Icon, Tooltip } from '@ohif/ui';

const PrimaryToolbar = ({ activeTool, tools, moreTools }) => {
  return (
    <div className="flex">
      {tools.map((tool) => {
        const { id, onClick, icon, label, dropdownContent } = tool;
        const isActive = activeTool === tool.id;
        return (
          <div className="relative flex justify-center" key={tool.id}>
            <ToolbarButton
              id={id}
              isActive={isActive}
              onClick={onClick}
              icon={icon}
              label={label}
              dropdownContent={dropdownContent}
            />
          </div>
        );
      })}
      {!!moreTools.length && (
        <>
          <span className="w-1 border-l py-4 mx-2 border-common-dark" />
          <Tooltip position="bottom" content="More tools">
            <IconButton
              className={classnames(
                'mx-1 text-common-bright hover:bg-primary-dark hover:text-primary-light'
              )}
              color="inherit"
            >
              <Icon name="tool-more-menu" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </div>
  );
};

PrimaryToolbar.defaultProps = {
  activeTool: '',
  moreTools: [],
};

PrimaryToolbar.propTypes = {
  activeTool: PropTypes.string,
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      icon: PropTypes.string,
      commandName: PropTypes.string,
      commandOptions: PropTypes.shape({
        toolName: PropTypes.string,
      }),
      onClick: PropTypes.func,
      dropdownContent: PropTypes.node,
    })
  ).isRequired,
  moreTools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      icon: PropTypes.string,
      commandName: PropTypes.string,
      commandOptions: PropTypes.shape({
        toolName: PropTypes.string,
      }),
      onClick: PropTypes.func,
    })
  ),
};

export default PrimaryToolbar;
