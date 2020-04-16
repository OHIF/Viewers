import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { IconButton, Icon, Tooltip } from '@ohif/ui';

const ToolbarButton = ({
  id,
  isActive,
  onClick,
  icon,
  label,
  dropdownContent,
}) => {
  const shouldShowDropdown = !!isActive && !!dropdownContent;
  return (
    <div key={id}>
      <Tooltip
        content={shouldShowDropdown ? dropdownContent : label}
        tight={shouldShowDropdown}
      >
        <IconButton
          variant={isActive ? 'contained' : 'text'}
          className={classnames('mx-1', {
            'text-black': isActive,
            'text-common-bright hover:bg-primary-dark hover:text-primary-light': !isActive,
          })}
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
};

ToolbarButton.propTypes = {
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  /** Tooltip content can be replaced for a customized content by passing a node to this value. */
  dropdownContent: PropTypes.node,
};

export default ToolbarButton;
