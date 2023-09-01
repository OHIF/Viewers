import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import Button, { ButtonEnums } from '../Button';
import Icon from '../Icon';

const Notification = ({
  id,
  type,
  message,
  actions,
  onSubmit,
  onOutsideClick,
}) => {
  const notificationRef = useRef(null);

  useEffect(() => {
    const notificationElement = notificationRef.current;
    const handleClick = function(event) {
      const isClickInside = notificationElement.contains(event.target);

      if (!isClickInside) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onOutsideClick]);

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
      className="flex flex-col p-2 mx-2 mt-2 border-2 rounded-md border-customblue-10 bg-customblue-400"
      data-cy={id}
    >
      <div className="flex items-center grow">
        <Icon name={icon} className={classnames('w-6 h-6', color)} />
        <span className="ml-2 text-[13px] text-black">{message}</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-end mt-2">
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

Notification.defaultProps = {
  type: 'info',
  onOutsideClick: () => {},
};

Notification.propTypes = {
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  message: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      type: PropTypes.oneOf([
        ButtonEnums.type.primary,
        ButtonEnums.type.secondary,
      ]).isRequired,
      size: PropTypes.oneOf([ButtonEnums.size.small, ButtonEnums.size.medium]),
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  /** Can be used as a callback to dismiss the notification for clicks that occur outside of it */
  onOutsideClick: PropTypes.func,
};

export default Notification;
