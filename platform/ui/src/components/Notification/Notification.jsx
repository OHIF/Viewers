import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Button, Icon } from '@ohif/ui';

const Notification = ({ type, message, actions, onSubmit }) => {
  const iconsByType = {
    error: {
      icon: 'info',
      color: 'text-red-700',
    },
    warning: {
      icon: 'info',
      color: 'text-yellow-500',
    },
    info: {
      icon: 'info',
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
    <div className="flex flex-col p-2 mx-2 mt-2 rounded bg-common-bright">
      <div className="flex flex-grow">
        <Icon name={icon} className={classnames('w-5', color)} />
        <span className="ml-2 text-base text-black">{message}</span>
      </div>
      <div className="flex justify-end mt-2">
        {actions.map((action, index) => {
          const isFirst = index === 0;
          const isPrimary = action.type === 'primary';

          return (
            <Button
              key={index}
              className={classnames({ 'ml-2': !isFirst })}
              color={isPrimary ? 'primary' : undefined}
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
};

Notification.propTypes = {
  type: PropTypes.string,
  message: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      type: PropTypes.oneOf(['primary', 'secondary', 'cancel']).isRequired,
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default Notification;
