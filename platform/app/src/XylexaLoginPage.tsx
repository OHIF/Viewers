import React from 'react';
import { useAuthenticationContext } from '@xylexa/xylexa-app';

import { Login } from '@xylexa/xylexa-app';
import mixpanel from 'mixpanel-browser';

import App from './App';

mixpanel.init(process.env.MIXPANEL_TOKEN || '8241e183878906c05ee355792c1eb8c5', {
  debug: true,
  track_pageview: false,
  persistence: 'localStorage',
  autocapture: false,
});

export const XylexaLoginPage = props => {
  const { currentServerConfigs } = useAuthenticationContext();
  console.log('currentServerConfigs: ', currentServerConfigs);

  const config = {
    ...window.config,
    dataSources: [
      {
        ...window.config?.dataSources?.[0],
        configuration: currentServerConfigs,
      },
    ],
  };

  return currentServerConfigs ? (
    <App
      config={config}
      defaultExtensions={props.defaultExtensions}
      defaultModes={props.defaultModes}
    />
  ) : (
    <Login />
  );
};
