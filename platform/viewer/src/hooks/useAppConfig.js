import { useCallback, useState } from 'react';

/**
 * Implements the state/methods defined in `appConfig.context`.
 */
export const useAppConfig = initialValue => {
  const [appConfig, setAppConfig] = useState(initialValue || {});

  const setCurrentAppConfig = useCallback(updatedConfig => {
    setAppConfig(updatedConfig);
  }, []);

  return {
    appConfig,
    setCurrentAppConfig,
  };
};
