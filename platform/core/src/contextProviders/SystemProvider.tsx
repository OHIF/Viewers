import React, { createContext, useContext } from 'react';
import { CommandsManager, HotkeysManager } from '../classes';
import { ExtensionManager } from '../extensions';

interface SystemContextProviderProps {
  children: React.ReactNode | React.ReactNode[] | ((...args: any[]) => React.ReactNode);
  services: AppTypes.Services;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
  hotkeysManager: HotkeysManager;
}

const systemContext = createContext(null);
const { Provider } = systemContext;

export const useSystem = () => useContext(systemContext);

export function SystemContextProvider({
  children,
  services,
  commandsManager,
  extensionManager,
  hotkeysManager,
}: SystemContextProviderProps) {
  return (
    <Provider value={{ services, commandsManager, extensionManager, hotkeysManager }}>
      {children}
    </Provider>
  );
}

export default SystemContextProvider;
