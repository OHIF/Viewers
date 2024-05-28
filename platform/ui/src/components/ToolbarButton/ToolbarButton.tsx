import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import IconButton from '../IconButton';
import Icon from '../Icon';
import Tooltip from '../Tooltip';

const ToolbarButton = ({
  id,
  icon,
  label,
  commands,
  onInteraction,
  dropdownContent = null,
  //
  className,
  disabled,
  disabledText,
  size,
  toolTipClassName,
  disableToolTip = false,
  ...rest
  //
}) => {
  const shouldShowDropdown = !!dropdownContent;
  const iconEl = icon ? <Icon name={icon} /> : <div>{label || 'Missing icon and label'}</div>;

  const sizeToUse = size ?? 'toolbar';
  const toolTipClassNameToUse =
    toolTipClassName !== undefined
      ? toolTipClassName
      : sizeToUse === 'toolbar'
        ? 'w-[40px] h-[40px]'
        : 'w-[32px] h-[32px]';

  return (
    <div key={id}>
      <Tooltip
        isSticky={shouldShowDropdown}
        content={shouldShowDropdown ? dropdownContent : label}
        secondaryContent={disabled ? disabledText : null}
        tight={shouldShowDropdown}
        className={toolTipClassNameToUse}
        isDisabled={disableToolTip}
      >
        <IconButton
          size={sizeToUse}
          className={classNames(className, disabled ? 'ohif-disabled' : '')}
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

ToolbarButton.propTypes = {
  /* Influences background/hover styling */
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  commands: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  onInteraction: PropTypes.func,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  /** Tooltip content can be replaced for a customized content by passing a node to this value. */
  dropdownContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  size: PropTypes.string,
  toolTipClassName: PropTypes.string,
  disableToolTip: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
