import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from 'sonner';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

const NotificationProvider = ({ children, service }) => {
  const DEFAULT_OPTIONS = {
    title: '',
    message: '',
    duration: 5000,
    position: 'bottom-right', // Aligning to Sonner's positioning system
    type: 'info', // info, success, error
  };

  const [notificationItems, setNotificationItems] = useState([]);

  const show = useCallback(options => {
    const { title, message, duration, position, type } = { ...DEFAULT_OPTIONS, ...options };
    const id = toast[type](message, {
      duration,
      position,
      render: () => (
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      ),
    });

    setNotificationItems(state => [...state, { id, ...options }]);
  }, []);

  const hide = useCallback(id => {
    toast.dismiss(id);
    setNotificationItems(state => state.filter(item => item.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    toast.dismiss();
    setNotificationItems([]);
  }, []);

  useEffect(() => {
    window.notification = { show, hide, hideAll };
  }, [show, hide, hideAll]);

  /**
   * Sets the implementation of a notification service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [service, hide, show]);

  return (
    <NotificationContext.Provider value={{ show, hide, hideAll, notificationItems }}>
      <Toaster position="bottom-right" />
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const withNotification = Component => {
  return function WrappedComponent(props) {
    const notificationContext = useNotification();
    return (
      <Component
        {...props}
        notificationContext={notificationContext}
      />
    );
  };
};

export default NotificationProvider;
