import React, { createContext, useContext } from 'react';
import { CommandsManager, HotkeysManager, MouseBindingsManager } from '../classes';
import { ExtensionManager } from '../extensions';
import { ServicesManager } from '../services';

interface SystemContextProviderProps {
  children: React.ReactNode | React.ReactNode[] | ((...args: any[]) => React.ReactNode);
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
  hotkeysManager: HotkeysManager;
  mouseBindingsManager: MouseBindingsManager;
}

const systemContext = createContext(null);
const { Provider } = systemContext;

export const useSystem = () => useContext<SystemContextProviderProps>(systemContext);

export function SystemContextProvider({
  children,
  servicesManager,
  commandsManager,
  extensionManager,
  hotkeysManager,
  mouseBindingsManager,
}: SystemContextProviderProps) {
  return (
    <Provider
      value={{
        servicesManager,
        commandsManager,
        extensionManager,
        hotkeysManager,
        mouseBindingsManager,
      }}
    >
      {children}
    </Provider>
  );
}

export default SystemContextProvider;
