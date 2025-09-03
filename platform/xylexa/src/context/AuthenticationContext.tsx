import React, { createContext, useContext, ReactNode } from 'react';
import useSecureLocalStorage from 'secure-local-storage-hook';
import {
  AUTH_TOKEN_STORAGE_KEY,
  SERVER_CONFIG_STORAGE_KEY,
  USER_DATA_STORAGE_KEY,
} from '../constants';
import { ServerConfigs } from '../types';
import { UserInfo } from '../types';

export type AuthToken = string | null;

export type SelectedServer = { id: number; value: string; label: string };

export type AuthenticationContextType = {
  authToken: AuthToken;
  setAuthToken?: (authToken: string) => void;
  currentServerConfigs: ServerConfigs | null;
  setCurrentServerConfigs?: (currentServerConfigs: ServerConfigs) => void;
  selectedServer: SelectedServer;
  setSelectedServer?: (selectedServer: SelectedServer) => void;
  serverOptions?: SelectedServer[];
  userInfo: UserInfo;
  setUserInfo?: (userInfo: UserInfo) => void;
  clearStorage?: () => void;
};

// Create a context with a default value of undefined
const AuthenticationContext = createContext<AuthenticationContextType>({
  authToken: '',
  selectedServer: { id: 0, value: 'cloud', label: 'Cloud' },
  currentServerConfigs: null,
  userInfo: null,
});

// Create a provider component
export const AuthenticationContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useSecureLocalStorage<AuthToken>(AUTH_TOKEN_STORAGE_KEY, null);

  const [currentServerConfigs, setCurrentServerConfigs] = useSecureLocalStorage<ServerConfigs>(
    SERVER_CONFIG_STORAGE_KEY,
    null
  );

  const serverOptions = [
    { id: 0, value: 'local', label: 'Local' },
    { id: 1, value: 'cloud', label: 'Cloud' },
  ];

  const [selectedServer, setSelectedServer] = useSecureLocalStorage(
    'type',
    serverOptions.find(r => r.value === 'cloud')
  );
  const [userInfo, setUserInfo] = useSecureLocalStorage<UserInfo>(USER_DATA_STORAGE_KEY, null);

  const clearStorage = () => {
    window.localStorage.clear();
  };

  return (
    <AuthenticationContext.Provider
      value={{
        authToken,
        setAuthToken,
        currentServerConfigs,
        setCurrentServerConfigs,
        selectedServer,
        setSelectedServer,
        serverOptions,
        userInfo,
        setUserInfo,
        clearStorage,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

// Custom hook to use the context
export const useAuthenticationContext = (): AuthenticationContextType => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthenticationContext must be used within a AuthenticationContextProvider');
  }
  return context;
};
