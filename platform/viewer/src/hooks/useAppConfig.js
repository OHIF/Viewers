import { useCallback, useState } from 'react';

/**
 * Implements the state/methods defined in `appConfig.context`.
 */
export const useAppConfig = initialValue => {
  const [config, setConfig] = useState(initialValue || {});

  const setCurrentConfig = useCallback(updatedConfig => {
    setConfig(updatedConfig);
  }, []);

  return {
    config,
    setCurrentConfig,
  };
};
