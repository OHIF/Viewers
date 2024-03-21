import React, { useState, useEffect, cloneElement, Children } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ButtonEnums } from '../../components';

const ButtonGroup = ({
  children,
  className,
  orientation = ButtonEnums.orientation.horizontal,
  activeIndex: defaultActiveIndex = 0,
  onActiveIndexChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  useEffect(() => {
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  const handleButtonClick = index => {
    setActiveIndex(index);
    onActiveIndexChange && onActiveIndexChange(index);
  };

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  const wrapperClasses = classnames('inline-flex', orientationClasses[orientation], className);

  return (
    <div
      className={classnames(
        wrapperClasses,
        'border-secondary-light rounded-[5px] border bg-black text-[13px]'
      )}
    >
      {Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return cloneElement(child, {
            key: index,
            className: classnames(
              'rounded-[4px] px-2 py-1',
              index === activeIndex
                ? 'bg-customblue-40 text-white'
                : 'text-primary-active bg-black',
              child.props.className // Respect original class names of the child
            ),
            onClick: e => {
              child.props.onClick && child.props.onClick(e);
              handleButtonClick(index);
            },
          });
        }
        return child;
      })}
    </div>
  );
};

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  orientation: PropTypes.oneOf(Object.values(ButtonEnums.orientation)),
  activeIndex: PropTypes.number,
  onActiveIndexChange: PropTypes.func,
  className: PropTypes.string,
};

export default ButtonGroup;
