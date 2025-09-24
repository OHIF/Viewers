import React, { createContext, useContext, useCallback, useEffect, ReactNode, useRef } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from '../components';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

// Notification deduplication cache
interface NotificationCacheEntry {
  timestamp: number;
  id: string;
}

interface NotificationProviderProps {
  children: ReactNode;
  service?: any;
  deduplicationInterval?: number;
}

const NotificationProvider = ({
  children,
  service,
  deduplicationInterval = 10000, // Default to 10 seconds
}: NotificationProviderProps) => {
  const DEFAULT_OPTIONS = {
    title: '',
    message: '',
    duration: 5000,
    position: 'bottom-right', // Aligning to Sonner's positioning system
    type: 'info', // info, success, error
  };

  // Cache for recent notifications to prevent duplicates
  // Structure: { [title_message_type]: { timestamp, id } }
  const recentNotificationsRef = useRef<Record<string, NotificationCacheEntry>>({});

  // Use the configurable deduplication interval from props

  const show = useCallback(options => {
    const {
      title,
      message,
      duration,
      position,
      type,
      promise,
      allowDuplicates = false,
      deduplicationInterval: optionsDeduplicationInterval,
      action,
    } = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Use the provider's deduplicationInterval by default, but allow it to be overridden per notification
    const notificationDeduplicationInterval = optionsDeduplicationInterval || deduplicationInterval;

    if (promise) {
      return toast.promise(promise, {
        loading: title || 'Loading...',
        success: (data: unknown) => {
          const description = typeof message === 'function' ? message(data) : message;
          return {
            title: title || 'Success',
            description,
          };
        },
        error: (err: unknown) => {
          const description = typeof message === 'function' ? message(err) : message;
          return {
            title: title || 'Error',
            description,
          };
        },
      });
    }

    // Create a cache key from notification properties
    const messageStr = typeof message === 'function' ? 'function' : message;
    const cacheKey = `${title}_${messageStr}_${type}`;

    // Handle deduplication
    if (!allowDuplicates && type === 'error') {
      const now = Date.now();
      const cachedNotification = recentNotificationsRef.current[cacheKey];

      // First check if we've shown this notification recently
      if (cachedNotification) {
        const timeSinceLastShown = now - cachedNotification.timestamp;

        // If it's been shown recently and within the deduplication interval,
        // don't show it again
        if (timeSinceLastShown < notificationDeduplicationInterval) {
          console.debug(
            `Prevented duplicate notification: "${title}" (${timeSinceLastShown}ms < ${notificationDeduplicationInterval}ms)`
          );
          // Return the existing notification ID
          return cachedNotification.id;
        }

        // If it's been shown before but outside the deduplication interval,
        // dismiss the old notification first and allow showing a new one
        console.debug(
          `Showing notification again after interval: "${title}" (${timeSinceLastShown}ms >= ${notificationDeduplicationInterval}ms)`
        );
        toast.dismiss(cachedNotification.id);
      }
    }

    // Show the notification with action if provided
    const toastOptions = {
      duration,
      position,
      description: message,
      id: options.id, // Use provided ID if available
    };

    // Add action button if provided
    if (action && action.label && typeof action.onClick === 'function') {
      toastOptions.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    const id = toast[type](title, toastOptions);

    // Cache this notification for deduplication if it's an error
    if (type === 'error') {
      const timestamp = Date.now();
      recentNotificationsRef.current[cacheKey] = {
        timestamp,
        id,
      };

      console.debug(
        `Stored notification in cache: "${title}" (id: ${id}, timestamp: ${timestamp})`
      );

      // We no longer auto-delete the cache entry after duration
      // Instead, we keep it to track when the notification was last shown
      // The entry will be checked against the deduplication interval
    }

    return id;
  }, []);

  const hide = useCallback(id => {
    toast.dismiss(id);

    // Remove from cache if present
    const cacheEntries = Object.entries(recentNotificationsRef.current);
    for (const [key, entry] of cacheEntries) {
      if (entry.id === id) {
        delete recentNotificationsRef.current[key];
        break;
      }
    }
  }, []);

  const hideAll = useCallback(() => {
    toast.dismiss();
    // Clear notification cache
    recentNotificationsRef.current = {};
  }, []);

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

  // Debug function to get the current cache (for development use)
  const getNotificationCache = useCallback(() => {
    const cache = { ...recentNotificationsRef.current };

    // Add human-readable timestamps and time since showing
    const now = Date.now();
    const enhancedCache = Object.entries(cache).reduce((result, [key, entry]) => {
      const timeSince = now - entry.timestamp;
      result[key] = {
        ...entry,
        date: new Date(entry.timestamp).toISOString(),
        timeSinceMs: timeSince,
        timeSinceStr: `${Math.floor(timeSince / 1000)}s ago`,
      };
      return result;
    }, {});

    return enhancedCache;
  }, []);

  return (
    <NotificationContext.Provider value={{ show, hide, hideAll, getNotificationCache }}>
      <Toaster position="bottom-right" />
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  service: PropTypes.object,
  deduplicationInterval: PropTypes.number,
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
