import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Button, ButtonEnums } from '../../components';

const ButtonGroup = ({
  buttons,
  onActiveIndexChange,
  className,
  orientation = ButtonEnums.orientation.horizontal,
  type = ButtonEnums.type.primary,
  size = ButtonEnums.size.medium,
  defaultActiveIndex = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  const handleButtonClick = (e, index) => {
    setActiveIndex(index);
    onActiveIndexChange && onActiveIndexChange(index);
    buttons[index].onClick && buttons[index].onClick(e);
  };

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  const wrapperClasses = classnames(
    'flex ',
    orientationClasses[orientation],
    className
  );

  return (
    <div className={wrapperClasses}>
      {buttons.map((buttonProps, index) => {
        const isActive = index === activeIndex;
        return (
          <Button
            {...buttonProps}
            key={index}
            type={
              isActive ? ButtonEnums.type.primary : ButtonEnums.type.secondary
            }
            size={size}
            className={classnames(buttonProps.className, {
              'rounded-l-[4px] rounded-r-none border border-secondary-light border-r-0':
                index === 0 && orientation === 'horizontal',
              'rounded-t-[4px] rounded-b-none border border-secondary-light border-b-0':
                index === 0 && orientation === 'vertical',
              'rounded-r-[4px] rounded-l-none border border-secondary-light border-l-0':
                index === buttons.length - 1 && orientation === 'horizontal',
              'rounded-b-[4px] rounded-t-none border border-secondary-light border-t-0':
                index === buttons.length - 1 && orientation === 'vertical',
              'rounded-none border border-secondary-light border-l-0 border-r-0':
                index !== 0 && index !== buttons.length - 1,
            })}
            onClick={e => handleButtonClick(e, index)}
          />
        );
      })}
    </div>
  );
};

ButtonGroup.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.object).isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  type: PropTypes.oneOf(Object.values(ButtonEnums.type)),
  size: PropTypes.oneOf(Object.values(ButtonEnums.size)),
  defaultActiveIndex: PropTypes.number,
  onActiveIndexChange: PropTypes.func,
  className: PropTypes.string,
};

export default ButtonGroup;
