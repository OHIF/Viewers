import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const DELAY_TO_SHOW = 1000;
const DELAY_TO_HIDE = 10; // it needs at least a little delay to prevent tooltip to suddenly hide
const DELAY_TO_HIDE_AFTER_COPYING = 1000;

const TooltipClipboard = ({ children, text = '' }) => {
  const { t } = useTranslation('TooltipClipboard');

  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const timeoutShow = useRef(null);
  const timeoutHide = useRef(null);
  const tooltipBoxRef = useRef(null);
  const tooltipContainerRef = useRef(null);

  const copyToClipboard = async text => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t('Copied'));
    } catch (err) {
      console.error('Failed to copy: ', err);
      setMessage(t('Failed to copy'));
    } finally {
      refreshElementPosition();

      setTimeout(() => {
        resetState();
      }, DELAY_TO_HIDE_AFTER_COPYING);
    }
  };

  const resetState = () => {
    setIsActive(false);
    setMessage(null);
    setIsCopying(false);
  };

  const resetTimeout = timeOut => {
    if (timeOut.current !== null) {
      clearTimeout(timeOut.current);
    }
  };

  const handleMouseOver = () => {
    resetTimeout(timeoutHide);

    if (!isActive) {
      timeoutShow.current = setTimeout(() => {
        timeoutShow.current = null;
        setIsActive(true);
      }, DELAY_TO_SHOW);
    }
  };

  const handleMouseOut = e => {
    resetTimeout(timeoutShow);

    if (isActive && !isCopying) {
      timeoutHide.current = setTimeout(() => {
        timeoutHide.current = null;
        resetState();
      }, DELAY_TO_HIDE);
    }
  };

  /**
   * Trick to set the tooltip position based on its parent position
   * because the tooltip box is not relative-positioned to avoid the tooltip
   * to be clipped if the parent container is overflow-hidden
   */
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
      if (typeof window !== 'undefined') {
        window.addEventListener('scroll', refreshElementPosition);
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', refreshElementPosition);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', refreshElementPosition);
      }
    };
  }, [isActive]);

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
            'bg-primary-dark border-secondary-main relative flex items-center rounded border px-2 py-2 text-base text-white'
          )}
        >
          {message || (
            <>
              {children}
              <div className="border-secondary-light ml-2 border-l pl-2">
                <Icon
                  name="clipboard"
                  className="w-4 text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TooltipClipboard.propTypes = {
  text: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default TooltipClipboard;
