import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import './tooltip.css';

const arrowPositionStyle = {
  bottom: {
    top: -15,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  'bottom-left': { top: -15, left: 5 },
  'bottom-right': { top: -15, right: 5 },
  right: {
    top: 'calc(50% - 8px)',
    left: -15,
    transform: 'rotate(270deg)',
  },
  left: {
    top: 'calc(50% - 8px)',
    right: -15,
    transform: 'rotate(-270deg)',
  },
};

const Tooltip = ({
  content,
  isSticky,
  position,
  tight,
  children,
  isDisabled,
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleMouseOver = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  const handleMouseOut = () => {
    if (isActive) {
      setIsActive(false);
    }
  };

  const isOpen = (isSticky || isActive) && !isDisabled;

  return (
    <div
      className="relative"
      onMouseOver={handleMouseOver}
      onFocus={handleMouseOver}
      onMouseOut={handleMouseOut}
      onBlur={handleMouseOut}
      role="tooltip"
    >
      {children}
      <div
        className={classnames(`tooltip tooltip-${position}`, {
          block: isOpen,
          hidden: !isOpen,
        })}
      >
        <div
          className={classnames(
            'relative tooltip-box bg-primary-dark border border-secondary-main text-white text-base rounded inset-x-auto top-full w-max-content',
            {
              'py-1 px-4': !tight,
            }
          )}
        >
          {content}
          <svg
            className="absolute h-4 text-primary-dark stroke-secondary-main"
            style={arrowPositionStyle[position]}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M24 22h-24l12-20z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

Tooltip.defaultProps = {
  tight: false,
  isSticky: false,
  position: 'bottom',
  isDisabled: false,
};

Tooltip.propTypes = {
  /** prevents tooltip from rendering despite hover/active/sticky */
  isDisabled: PropTypes.bool,
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  position: PropTypes.oneOf([
    'bottom',
    'bottom-left',
    'bottom-right',
    'left',
    'right',
  ]),
  isSticky: PropTypes.bool,
  tight: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Tooltip;
