import React from 'react';
import PropTypes from 'prop-types';

import IconButton from '../IconButton';
import Icon from '../Icon';
import Tooltip from '../Tooltip';

const ToolbarButton = ({
  id,
  icon,
  label,
  commands,
  onInteraction,
  dropdownContent,
  //
  className,
  ...rest
  //
}) => {
  // const classes = {
  //   toggle: isActive
  //     ? '!text-[#348CFD]'
  //     : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
  //   action: isActive
  //     ? 'text-black'
  //     : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
  // };

  // const bgClasses = {
  //   toggle: isActive && 'bg-transparent',
  // };

  // const activeClass = isActive ? 'active' : '';
  // const shouldShowDropdown = !!isActive && !!dropdownContent;
  const shouldShowDropdown = !!dropdownContent;
  const iconEl = icon ? <Icon name={icon} /> : <div>{label || 'Missing icon and label'}</div>;

  return (
    <div key={id}>
      <Tooltip
        isSticky={shouldShowDropdown}
        content={shouldShowDropdown ? dropdownContent : label}
        tight={shouldShowDropdown}
      >
        <IconButton
          size="toolbar"
          className={className}
          onClick={() => {
            onInteraction({
              itemId: id,
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
};

ToolbarButton.propTypes = {
  /* Influences background/hover styling */
  id: PropTypes.string.isRequired,
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
