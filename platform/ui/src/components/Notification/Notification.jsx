import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

const Notification = ({ type, text, actionButtons }) => {
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
    <div className="mx-2 p-2 flex flex-col bg-common-bright rounded">
      <div className="flex flex-grow">
        <Icon name={icon} className={classnames('w-5', color)} />
        <span className="text-base text-black ml-2">{text}</span>
      </div>
      <div className="flex justify-end mt-2">{actionButtons}</div>
    </div>
  );
};

Notification.defaultProps = {
  type: 'info',
};

Notification.propTypes = {
  type: PropTypes.string,
  text: PropTypes.string.isRequired,
  actionButtons: PropTypes.node.isRequired,
};

export default Notification;
