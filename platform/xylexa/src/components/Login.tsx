import React, { useState } from 'react';
import { Icon, Svg } from '@ohif/ui';
import { useToast } from '../../../xylexa/src/hooks';

import {
  AUTH_TOkEN_LOCAL_STORAGE_KEY,
  JWT_AUTH_KEY,
  useAuthenticationContext,
  useGetUserInfo,
  useLogin,
  USER_INFO_LOCAL_STORAGE_KEY,
} from '@xylexa/xylexa-app';
import secureLocalStorage from 'react-secure-storage';

interface FormElements extends HTMLFormControlsCollection {
  username: HTMLInputElement;
  password: HTMLInputElement;
  rememberMe: HTMLInputElement;
}
interface LoginFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

export const Login: React.FC = () => {
  const { setCurrentServerConfigs, setUserInfo, authToken, clearStorage, setAuthToken } =
    useAuthenticationContext();

  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { mutate: handleLogin, isPending, error } = useLogin();
  const { data: userInfo, status: userInfoStatus } = useGetUserInfo();

  const handleSubmit = async (event: React.FormEvent<LoginFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget.elements;

    handleLogin(
      {
        username: form.username.value,
        password: form.password.value,
        grant_type: 'password',
        client_id: 'orthanc',
        scope: 'openid email profile',
      },
      {
        onSuccess: res => {
          const { access_token } = res?.data;
          showToast({
            content: 'Login Success',
            type: 'success',
          });
          setAuthToken(access_token);
          secureLocalStorage.setItem(AUTH_TOkEN_LOCAL_STORAGE_KEY, access_token);
        },

        onError() {
          showToast({
            content: 'Login Failed',
            type: 'error',
          });
          clearStorage();
        },
      }
    );
  };

  if (userInfoStatus === 'success') {
    setUserInfo(userInfo);
    const cloudConfig = userInfo?.groupConfig?.find(({ PACS_type }) => PACS_type === 'cloud');
    const localConfig = userInfo?.groupConfig?.find(({ PACS_type }) => PACS_type === 'local');
    const availableServerConfig = localConfig || cloudConfig;

    if (availableServerConfig) {
      setCurrentServerConfigs({
        ...availableServerConfig,
        requestOptions: {
          auth: authToken,
          requestFromBrowser: true,
        },
      });

      // explicitly storing auth_token in Localstorage to avoid race condition while accessing token to
      // retrieve segmentations
      secureLocalStorage.setItem(JWT_AUTH_KEY, authToken);
      showToast({
        content: `Connected to ${availableServerConfig?.PACS_type}`,
        type: 'success',
      });
    }
    secureLocalStorage.setItem(USER_INFO_LOCAL_STORAGE_KEY, userInfo);
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <div className="flex h-[100vh] w-full flex-col items-center justify-center bg-black px-5">
        <div className="mb-2 flex w-full flex-col items-end justify-start overflow-hidden xl:max-w-2xl"></div>
        <div className="w-[500px] border-2 border-blue-700 bg-black p-5 sm:p-10 xl:max-w-2xl">
          <h1 className="text-center text-xl font-semibold text-white sm:text-3xl">
            <div className="mb-2 grid place-items-center">
              <Svg
                name="logo-xylexa"
                style={{ width: '12rem' }}
              />
            </div>
          </h1>
          <form
            className="mt-8 w-full"
            onSubmit={handleSubmit}
          >
            <div className="mx-auto flex max-w-xs flex-col gap-4 sm:max-w-md md:max-w-lg">
              <input
                id="username"
                name="username"
                type="text"
                className="w-full border-2 border-transparent bg-[#302E30] px-5 py-4 text-sm font-medium text-white placeholder-gray-500 focus:border-2 focus:border-white focus:outline-none focus:outline"
                placeholder="Username"
                required
              />
              <div className="flex flex-row rounded-none bg-[#302E30]">
                <input
                  id="password"
                  name="password"
                  className="w-full border-2 border-transparent bg-[#302E30] px-5 py-3 text-sm font-medium text-white placeholder-gray-500 focus:border-2 focus:border-white focus:outline-none focus:outline"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                />

                <button
                  onClick={handleClickShowPassword}
                  className="bg-[#302E30] p-4"
                  type="button"
                >
                  <Icon
                    name={!showPassword ? 'eye-visible' : 'eye-hidden'}
                    style={{ width: '25', height: '25', color: 'white' }}
                  />
                </button>
              </div>
              <div className="flex items-center">
                <input
                  id="rememberme"
                  type="checkbox"
                  name="rememberMe"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                />
                <label className="ms-2 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Remember Me
                </label>
              </div>
              <button
                className={`focus:shadow-outline mt-5 flex w-full items-center justify-center bg-[#8f1a1c] py-4 font-semibold tracking-wide text-gray-100 transition-all duration-300 ease-in-out hover:bg-[#8f1a1c]/90 focus:outline-none`}
                type="submit"
              >
                {!isPending ? (
                  <div className="flex flex-row justify-center">
                    <svg
                      className="-ml-2 h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle
                        cx="8.5"
                        cy="7"
                        r="4"
                      />
                      <path d="M20 8v6M23 11h-6" />
                    </svg>
                    <span className="ml-3">LOGIN</span>
                  </div>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="mx-auto h-8 w-8 animate-spin text-gray-200 dark:text-gray-600"
                    viewBox="0 0 100 101"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                )}
              </button>
              <div className={!error?.response?.data.detail ? 'hidden' : 'w-full text-red-600'}>
                {error?.response?.data.detail && (
                  <p className="overflow-hidden overflow-ellipsis">
                    <p>{error?.response?.data.detail}</p>
                  </p>
                )}
              </div>
              <p className="mt-6 text-center text-sm text-gray-600">
                For account setup or technical queries,{' '}
                <span className="font-semibold text-[#2c55e9]">Contact us</span>
              </p>
            </div>
          </form>
        </div>
      </div>
      <p className="-mt-8 text-center text-white">XyCAD Version 3.0 | Xylexa, Inc. © 2024</p>
    </div>
  );
};
