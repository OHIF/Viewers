import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { IconButton, Icon, Tooltip } from '@ohif/ui';

const ToolbarButton = ({
  type,
  id,
  isActive,
  onClick,
  icon,
  label,
  dropdownContent,
}) => {
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
          className={classnames('mx-1', classes.type[type])}
          onClick={onClick}
          key={id}
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
  type: 'primary',
};

ToolbarButton.propTypes = {
  /* Influences background/hover styling */
  type: PropTypes.oneOf(['primary', 'secondary']),
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  /** Tooltip content can be replaced for a customized content by passing a node to this value. */
  dropdownContent: PropTypes.node,
};

export default ToolbarButton;
