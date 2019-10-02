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

const getServers = (appConfig, project, location, dataset, dicomstore) => {
  let servers;
  if (appConfig.enableGoogleCloudAdapter) {
    const pathUrl = GoogleCloudApi.getUrlBaseDicomWeb(
      project,
      location,
      dataset,
      dicomstore
    );
    const data = {
      wadoUriRoot: pathUrl,
      qidoRoot: pathUrl,
      wadoRoot: pathUrl,
    };
    servers = GoogleCloudUtilServers.getServers(data, dicomstore);
  }

  return servers;
};

const updateServer = (
  appConfig,
  dispatch,
  project,
  location,
  dataset,
  dicomstore
) => {
  const servers = getServers(appConfig, project, location, dataset, dicomstore);

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
  dicomstore,
} = {}) {
  // Hooks
  const servers = useSelector(state => state && state.servers);
  const dispatch = useDispatch();
  const { appConfig = {} } = useContext(AppContext);

  const server = getActiveServer(servers);

  if (!server) {
    updateServer(appConfig, dispatch, project, location, dataset, dicomstore);
  } else {
    return server;
  }
}
