import React, { createContext, useContext } from 'react';
import { CommandsManager, HotkeysManager } from '../classes';
import { ExtensionManager } from '../extensions';
import { ServicesManager } from '../services';

interface SystemContextProviderProps {
  children: React.ReactNode | React.ReactNode[] | ((...args: any[]) => React.ReactNode);
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
  hotkeysManager: HotkeysManager;
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
}: SystemContextProviderProps) {
  return (
    <Provider value={{ servicesManager, commandsManager, extensionManager, hotkeysManager }}>
      {children}
    </Provider>
  );
}

export default SystemContextProvider;
