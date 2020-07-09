import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '@ohif/ui';

const TooltipClipboard = ({ children, text }) => {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState(null);

  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      setMessage('Failed to copy!');
    } finally {
      refreshElementPosition();

      setTimeout(() => {
        resetState();
      }, 1000);
    }
  };

  const resetState = () => {
    setIsActive(false);
    setMessage(null);
  };

  const handleMouseOver = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  const handleMouseOut = () => {
    if (isActive && !message) {
      setIsActive(false);
    }
  };

  const tooltipBoxRef = useRef(null);
  const tooltipContainerRef = useRef(null);

  const refreshElementPositionWhenScrolling = useCallback(() => {
    refreshElementPosition();
  }, []);

  const refreshElementPosition = () => {
    const tooltipContainer = tooltipContainerRef.current;
    const tooltipBox = tooltipBoxRef.current;

    const {
      left: containerX,
      top: containerY,
      height: containerHeight,
    } = tooltipContainer.getBoundingClientRect();

    const top = containerY + containerHeight + 'px';
    const left = containerX + 'px';

    tooltipBox.style.top = top;
    tooltipBox.style.left = left;
  };

  useEffect(() => {
    if (isActive) {
      refreshElementPosition();
      window.addEventListener('scroll', refreshElementPositionWhenScrolling);
    } else {
      window.removeEventListener('scroll', refreshElementPositionWhenScrolling);
    }
  }, [refreshElementPositionWhenScrolling, isActive]);

  const onClickHandler = e => {
    e.stopPropagation();
    copyToClipboard(text || children);
  };

  return (
    <div
      className={classnames('inline-flex max-w-full')}
      onMouseOver={handleMouseOver}
      onFocus={handleMouseOver}
      onMouseOut={handleMouseOut}
      onBlur={handleMouseOut}
      role="tooltip"
      ref={tooltipContainerRef}
    >
      <span className="truncate">{children}</span>
      <div
        className={classnames(`fixed pt-1`, {
          block: isActive,
          hidden: !isActive,
        })}
        ref={tooltipBoxRef}
        onClick={onClickHandler}
      >
        <div
          className={classnames(
            'flex items-center relative bg-primary-dark border border-secondary-main text-white text-base rounded px-2 py-2'
          )}
        >
          {message || (
            <>
              {children}
              <div className="ml-2 pl-2 border-l border-secondary-light">
                <Icon name="clipboard" className="w-4 text-white" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TooltipClipboard.defaultProps = {
  text: '',
};

TooltipClipboard.propTypes = {
  text: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default TooltipClipboard;
