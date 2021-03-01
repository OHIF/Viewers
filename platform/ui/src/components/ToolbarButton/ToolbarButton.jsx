import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { IconButton, Icon, Tooltip } from '../';

const ToolbarButton = ({
  type,
  id,
  icon,
  label,
  commandName,
  commandOptions,
  onInteraction,
  dropdownContent,
  //
  isActive: _isActive,
  bState = {},
  //
}) => {
  const { primaryToolId } = bState;
  const isActive = _isActive || (type === 'tool' && id === primaryToolId);
  const classes = {
    type: {
      primary: isActive
        ? 'text-black'
        : 'text-common-bright hover:bg-primary-dark hover:text-primary-light',
      secondary: isActive
        ? 'text-black'
        : 'text-white hover:bg-secondary-dark hover:text-white focus:bg-secondary-dark focus:text-white',
    },
  };

  const activeClass = isActive ? 'active' : '';
  const shouldShowDropdown = !!isActive && !!dropdownContent;

  return (
    <div key={id}>
      <Tooltip
        isSticky={shouldShowDropdown}
        content={shouldShowDropdown ? dropdownContent : label}
        tight={shouldShowDropdown}
      >
        <IconButton
          variant={isActive ? 'contained' : 'text'}
          size="toolbar"
          className={classnames('mx-1', activeClass, classes.type[type])}
          onClick={() => {
            onInteraction({
              itemId: id,
              interactionType: type,
              commandName: commandName,
              commandOptions: commandOptions,
            });
          }}
          name={label}
          key={id}
          id={id}
        >
          <Icon name={icon} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

ToolbarButton.defaultProps = {
  dropdownContent: null,
  isActive: false,
  type: 'action',
};

ToolbarButton.propTypes = {
  /* Influences background/hover styling */
  type: PropTypes.oneOf(['action', 'toggle', 'tool']),
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onInteraction: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  /** Tooltip content can be replaced for a customized content by passing a node to this value. */
  dropdownContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default ToolbarButton;
