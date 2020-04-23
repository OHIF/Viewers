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

const Tooltip = ({ position, content, tight, children }) => {
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

  return (
    <div
      className="relative "
      onMouseOver={handleMouseOver}
      onFocus={handleMouseOver}
      onMouseOut={handleMouseOut}
      onBlur={handleMouseOut}
      role="tooltip"
    >
      {children}
      <div
        className={classnames(`tooltip tooltip-${position}`, {
          block: isActive,
          hidden: !isActive,
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
            className="absolute text-primary-dark h-4 stroke-secondary-main"
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
  position: 'bottom',
};

Tooltip.propTypes = {
  tight: PropTypes.bool,
  position: PropTypes.oneOf([
    'bottom',
    'bottom-left',
    'bottom-right',
    'left',
    'right',
  ]),
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
};

export default Tooltip;
