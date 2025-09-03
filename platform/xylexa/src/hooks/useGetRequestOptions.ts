import { AxiosRequestConfig } from 'axios';

export type AuthToken = string;
export type AuthType = 'bearer' | 'basic';

/**
 * Creates axios request options with authentication headers
 * @param authToken - The authentication token to use
 * @param authType - The type of authentication ('bearer' or 'basic'). Defaults to 'bearer'
 * @returns AxiosRequestConfig with Content-Type and Authorization headers
 */
export const useGetRequestOptions = (authToken: AuthToken, authType: AuthType = 'bearer') => {
  const options: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    options.headers = {
      ...options.headers,
      Authorization: authType === 'bearer' ? `Bearer ${authToken}` : `Basic ${authToken}`,
    };
  }

  return options;
};
