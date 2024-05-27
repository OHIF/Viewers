import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import Button, { ButtonEnums } from '../Button';
import Icon from '../Icon';

const Notification = ({
  id,
  type = 'info',
  message,
  actions,
  onSubmit,
  onOutsideClick = () => {},
  onKeyPress,
}) => {
  const notificationRef = useRef(null);

  useEffect(() => {
    const notificationElement = notificationRef.current;
    const handleClick = function (event) {
      const isClickInside = notificationElement.contains(event.target);

      if (!isClickInside) {
        onOutsideClick();
      }
    };

    // Both a mouse down and up listeners are desired so as to avoid missing events
    // from elements that have pointer-events:none (e.g. the active viewport).
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('mouseup', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('mouseup', handleClick);
    };
  }, [onOutsideClick]);

  useEffect(() => {
    notificationRef.current.focus();
  }, []);

  const iconsByType = {
    error: {
      icon: 'info',
      color: 'text-red-700',
    },
    warning: {
      icon: 'notificationwarning-diamond',
      color: 'text-yellow-500',
    },
    info: {
      icon: 'notifications-info',
      color: 'text-primary-main',
    },
    success: {
      icon: 'info',
      color: 'text-green-500',
    },
  };

  const getIconData = () => {
    return (
      iconsByType[type] || {
        icon: '',
        color: '',
      }
    );
  };

  const { icon, color } = getIconData();

  return (
    <div
      ref={notificationRef}
      className="border-customblue-10 bg-customblue-400 mx-2 mt-2 flex flex-col rounded-md border-2 p-2 outline-none"
      data-cy={id}
      onKeyDown={onKeyPress}
      tabIndex={0}
    >
      <div className="flex grow items-center">
        <Icon
          name={icon}
          className={classnames('h-6 w-6', color)}
        />
        <span className="ml-2 text-[13px] text-black">{message}</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        {actions?.map((action, index) => {
          return (
            <Button
              name={action.id}
              key={index}
              type={action.type}
              size={action.size || ButtonEnums.size.small}
              onClick={() => {
                onSubmit(action.value);
              }}
            >
              {action.text}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

Notification.propTypes = {
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  message: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      type: PropTypes.oneOf([ButtonEnums.type.primary, ButtonEnums.type.secondary]).isRequired,
      size: PropTypes.oneOf([ButtonEnums.size.small, ButtonEnums.size.medium]),
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  /** Can be used as a callback to dismiss the notification for clicks that occur outside of it */
  onOutsideClick: PropTypes.func,
  onKeyPress: PropTypes.func,
};

export default Notification;
