import React, { useContext } from 'react';
import GoogleCloudApi from '../googleCloud/api/GoogleCloudApi';

import * as GoogleCloudUtilServers from '../googleCloud/utils/getServers';
import { useSelector, useDispatch } from 'react-redux';

// Contexts
import AppContext from '../context/AppContext';

const getActiveServer = servers => {
  const isActive = a => a.active === true;

  return servers && servers.servers && servers.servers.find(isActive);
};

const getServers = (appConfig, project, location, dataset, dicomStore) => {
  let servers = [];
  if (appConfig.enableGoogleCloudAdapter) {
    const pathUrl = GoogleCloudApi.getUrlBaseDicomWeb(
      project,
      location,
      dataset,
      dicomStore
    );
    const data = {
      project,
      location,
      dataset,
      dicomStore,
      wadoUriRoot: pathUrl,
      qidoRoot: pathUrl,
      wadoRoot: pathUrl,
    };
    servers = GoogleCloudUtilServers.getServers(data, dicomStore);
    if (!isValidServer(servers[0], appConfig)) {
      return;
    }
  }

  return servers;
};

const isValidServer = (server, appConfig) => {
  if (appConfig.enableGoogleCloudAdapter) {
    return GoogleCloudUtilServers.isValidServer(server);
  } else {
    return !!server;
  }
};

const updateServer = (
  appConfig,
  dispatch,
  project,
  location,
  dataset,
  dicomStore
) => {
  const servers = getServers(appConfig, project, location, dataset, dicomStore);

  if (servers && servers.length) {
    const action = {
      type: 'SET_SERVERS',
      servers,
    };
    dispatch(action);
  }
};

export default function useServer({
  project,
  location,
  dataset,
  dicomStore,
} = {}) {
  // Hooks
  const servers = useSelector(state => state && state.servers);
  const dispatch = useDispatch();
  const { appConfig = {} } = useContext(AppContext);

  const server = getActiveServer(servers);

  if (!isValidServer(server, appConfig)) {
    updateServer(appConfig, dispatch, project, location, dataset, dicomStore);
  } else {
    return server;
  }
}
