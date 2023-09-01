import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ButtonEnums } from '../../components';

const ButtonGroup = ({
  buttons,
  onActiveIndexChange,
  className,
  orientation = ButtonEnums.orientation.horizontal,
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
    'inline-flex',
    orientationClasses[orientation],
    className
  );

  return (
    <div
      className={classnames(
        wrapperClasses,
        'border border-secondary-light rounded-[5px] bg-black text-[13px] '
      )}
    >
      {buttons.map((buttonProps, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            {...buttonProps}
            key={index}
            className={classnames(
              'px-2 py-1 rounded-[4px]',
              isActive
                ? 'bg-customblue-40 text-white'
                : 'bg-black text-primary-active'
            )}
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
