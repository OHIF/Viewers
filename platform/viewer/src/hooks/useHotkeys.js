import { useEffect, useState } from 'react';

/**
 * @param {Object} manager HotkeysManager instance
 * @param {Object} hotkeys hotkey bindings
 * @param {Object} defaultHotkeys default hotkey bindings
 */
const useHotkeys = (manager, hotkeys, defaultHotkeys) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!hotkeys) {
      console.warn('[hotkeys] No bindings defined for hotkeys hook!');
      return;
    }

    console.debug('[hotkeys] Setting up hotkeys...');
    manager.setDefaultHotKeys(defaultHotkeys || hotkeys);
    manager.setHotkeys(hotkeys);
    setIsLoaded(true);

    return () => {
      console.debug('[hotkeys] Removing hotkeys...');
      manager.destroy();
    };
  }, [manager, hotkeys, defaultHotkeys]);

  return isLoaded;
}

export default useHotkeys;
