import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';

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
  top: {
    bottom: -15,
    left: '50%',
    transform: 'translateX(-50%) rotate(180deg)',
  },
};

const Tooltip = ({
  content,
  secondaryContent = null,
  isSticky,
  position,
  className,
  tight,
  children,
  isDisabled,
  content,
  isSticky,
  position,
  className,
  tooltipBoxClassName,
  tight,
  children,
  isDisabled,
  // time to show/hide the tooltip on mouse over and  mouse out events (default: 300ms)
  showHideDelay,
  onHide,
}) => {
  const [isActive, setIsActive] = useState(false);
  const isOpen = useMemo(
    () => (isSticky || isActive) && !isDisabled,
    [isSticky, isActive, isDisabled]
  );
  const { t } = useTranslation('Buttons');

  const handleMouseOverDebounced = useMemo(
    () => debounce(() => setIsActive(true), showHideDelay),
    [showHideDelay]
  );

  const handleMouseOutDebounced = useMemo(
    () => debounce(() => setIsActive(false), showHideDelay),
    [showHideDelay]
  );

  const handleMouseOver = () => {
    handleMouseOutDebounced.cancel();
    handleMouseOverDebounced();
  };

  const handleMouseOut = () => {
    handleMouseOverDebounced.cancel();
    handleMouseOutDebounced();
  };

  useEffect(() => {
    if (!isOpen && onHide) {
      onHide();
    }
  }, [isOpen, onHide]);

  return (
    <div
      className={classnames('relative', className)}
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
            'tooltip-box bg-primary-dark border-secondary-light w-max-content relative inset-x-auto top-full rounded border text-base text-white',
            {
              'py-[6px] px-[8px]': !tight,
              tooltipBoxClassName,
            }
          )}
        >
          <div>{typeof content === 'string' ? t(content) : content}</div>
          <div className="text-aqua-pale">
            {typeof secondaryContent === 'string' ? t(secondaryContent) : secondaryContent}
          </div>
          <svg
            className="text-primary-dark stroke-secondary-light absolute h-4"
            style={arrowPositionStyle[position]}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M24 22l-12-20l-12 20"
            />
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
  showHideDelay: 300,
};

Tooltip.propTypes = {
  /** prevents tooltip from rendering despite hover/active/sticky */
  isDisabled: PropTypes.bool,
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  position: PropTypes.oneOf(['bottom', 'bottom-left', 'bottom-right', 'left', 'right', 'top']),
  isSticky: PropTypes.bool,
  tight: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  tooltipBoxClassName: PropTypes.string,
  showHideDelay: PropTypes.number,
  onHide: PropTypes.func,
};

export default Tooltip;
