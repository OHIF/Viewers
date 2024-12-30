import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import IconButton from '../IconButton';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';

const ToolbarButton = ({
  id,
  icon,
  label,
  commands,
  onInteraction,
  dropdownContent = null,
  className,
  disabled,
  disabledText,
  size,
  toolTipClassName,
  disableToolTip = false,
  ...rest
}) => {
  const shouldShowDropdown = !!dropdownContent;
  const iconEl = icon ? (
    <Icons.ByName name={icon} />
  ) : (
    <div>{label || 'Missing icon and label'}</div>
  );

  const sizeToUse = size ?? 'toolbar';

  const handleClick = () => {
    onInteraction({
      itemId: id,
      commands,
    });
  };

  if (disableToolTip) {
    return (
      <div key={id}>
        <IconButton
          size={sizeToUse}
          className={classNames(className, disabled ? 'ohif-disabled' : '')}
          onClick={handleClick}
          name={label}
          key={id}
          id={id}
          {...rest}
        >
          {iconEl}
        </IconButton>
      </div>
    );
  }

  return (
    <div key={id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <IconButton
              size={sizeToUse}
              className={classNames(className, disabled ? 'ohif-disabled' : '')}
              onClick={handleClick}
              name={label}
              key={id}
              id={id}
              {...rest}
            >
              {iconEl}
            </IconButton>
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          className={classNames('w-auto', toolTipClassName)}
        >
          {shouldShowDropdown ? dropdownContent : label}
          {disabled && disabledText ? (
            <div className="text-muted-foreground mt-0 text-sm">{disabledText}</div>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

ToolbarButton.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  commands: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  onInteraction: PropTypes.func,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  dropdownContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  size: PropTypes.string,
  toolTipClassName: PropTypes.string,
  disableToolTip: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledText: PropTypes.string,
};

export default ToolbarButton;
