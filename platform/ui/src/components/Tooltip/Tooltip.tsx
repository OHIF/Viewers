import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash.debounce';

import ReactDOM from 'react-dom';

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
  isSticky = false,
  position = 'bottom',
  className,
  tight = false,
  children,
  isDisabled = false,
  tooltipBoxClassName,
  // time to show/hide the tooltip on mouse over and  mouse out events (default: 300ms)
  showHideDelay = 300,
  onHide,
}) => {
  const [isActive, setIsActive] = useState(false);
  const isOpen = useMemo(
    () => (isSticky || isActive) && !isDisabled,
    [isSticky, isActive, isDisabled]
  );
  const { t } = useTranslation('Buttons');
  const tooltipContainer = document.getElementById('react-portal');
  const [coords, setCoords] = useState({ x: 999999, y: 999999 });
  const parentRef = useRef(null);
  const tooltipRef = useRef(null);

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
    return () => {
      handleMouseOverDebounced.cancel();
      handleMouseOutDebounced.cancel();
    };
  }, [handleMouseOverDebounced, handleMouseOutDebounced]);

  useEffect(() => {
    if (!isOpen && onHide) {
      onHide();
    }
  }, [isOpen, onHide]);

  useEffect(() => {
    if (parentRef.current && tooltipRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const parentWidth = parentRect.width;
      const parentHeight = parentRect.height;
      const tooltipWidth = tooltipRect.width;

      let newX = 0;
      let newY = 0;

      switch (position) {
        case 'bottom':
          newX = parentRect.left + parentWidth / 2;
          newY = parentRect.top + parentHeight;
          break;
        case 'top':
          newX = parentRect.left + parentWidth / 2;
          newY = parentRect.top - parentHeight * 2;
          break;
        case 'right':
          newX = parentRect.left + parentWidth;
          newY = parentRect.top + parentHeight / 2;
          break;
        case 'left':
          newX = parentRect.left - tooltipWidth - 10;
          newY = parentRect.top + parentHeight / 2;
          break;
        case 'bottom-left':
          newX = parentRect.left;
          newY = parentRect.top + parentHeight;
          break;
        case 'bottom-right':
          newX = parentRect.left - tooltipWidth + parentWidth;
          newY = parentRect.top + parentHeight;
          break;
        default:
          break;
      }

      setCoords({ x: newX, y: newY });
    }
  }, [isOpen, position, parentRef.current, tooltipRef.current]);

  const tooltipContent = (
    <div
      className={classnames(`tooltip tooltip-${position} block`, 'z-50')}
      style={{
        position: 'fixed',
        top: coords.y,
        left: isOpen ? coords.x : 999999,
      }}
    >
      <div
        ref={tooltipRef}
        className={classnames(
          'tooltip-box bg-primary-dark border-secondary-light w-max-content relative inset-x-auto top-full rounded border text-base text-white',
          {
            'py-[6px] px-[8px]': !tight,
          },
          tooltipBoxClassName
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
  );

  return (
    <div
      ref={parentRef}
      className={classnames('relative', className)}
      onMouseOver={handleMouseOver}
      onFocus={handleMouseOver}
      onMouseOut={handleMouseOut}
      onBlur={handleMouseOut}
      role="tooltip"
    >
      {children}
      {tooltipContainer && ReactDOM.createPortal(tooltipContent, tooltipContainer)}
    </div>
  );
};

Tooltip.propTypes = {
  isDisabled: PropTypes.bool,
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  secondaryContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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
