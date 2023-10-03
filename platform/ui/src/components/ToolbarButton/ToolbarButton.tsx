import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import IconButton from '../IconButton';
import Icon from '../Icon';
import Tooltip from '../Tooltip';

const ToolbarButton = ({
  type = 'tool',
  id,
  icon,
  label,
  commands,
  onInteraction,
  dropdownContent,
  //
  isActive,
  className,
  ...rest
  //
}) => {
  const classes = {
    tool: isActive
      ? 'text-black'
      : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
    toggle: isActive
      ? '!text-[#348CFD]'
      : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
    action: isActive
      ? 'text-black'
      : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
  };

  const bgClasses = {
    toggle: isActive && 'bg-transparent',
  };

  const activeClass = isActive ? 'active' : '';
  const shouldShowDropdown = !!isActive && !!dropdownContent;
  const iconEl = icon ? <Icon name={icon} /> : <div>{label || 'Missing icon and label'}</div>;

  return (
    <div key={id}>
      <Tooltip
        isSticky={shouldShowDropdown}
        content={shouldShowDropdown ? dropdownContent : label}
        tight={shouldShowDropdown}
      >
        <IconButton
          variant={isActive ? 'contained' : 'text'}
          bgColor={bgClasses[type]}
          size="toolbar"
          className={classnames(activeClass, classes[type], className)}
          onClick={() => {
            onInteraction({
              itemId: id,
              interactionType: type,
              commands,
            });
          }}
          name={label}
          key={id}
          id={id}
          {...rest}
        >
          {iconEl}
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
  className: PropTypes.string,
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      commandName: PropTypes.string.isRequired,
      commandOptions: PropTypes.object,
    })
  ),
  onInteraction: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  /** Tooltip content can be replaced for a customized content by passing a node to this value. */
  dropdownContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default ToolbarButton;
