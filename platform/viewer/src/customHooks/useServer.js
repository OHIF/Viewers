import React, { useContext } from 'react';
import GoogleCloudApi from '../googleCloud/api/GoogleCloudApi';
import usePrevious from './usePrevious';

import * as GoogleCloudUtilServers from '../googleCloud/utils/getServers';
import { useSelector, useDispatch } from 'react-redux';
import isEqual from 'lodash.isequal';

// Contexts
import AppContext from '../context/AppContext';

const getActiveServer = servers => {
  const isActive = a => a.active === true;

  return servers && servers.servers && servers.servers.find(isActive);
};

const getServers = (appConfig, project, location, dataset, dicomStore) => {
  let servers = [];
  if (appConfig.enableGoogleCloudAdapter) {
    GoogleCloudApi.urlBase = appConfig.healthcareApiEndpoint;
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
  }

  return !!server;
};

const setServers = (dispatch, servers) => {
  const action = {
    type: 'SET_SERVERS',
    servers,
  };
  dispatch(action);
};

const useServerFromUrl = (
  servers = [],
  previousServers,
  activeServer,
  urlBasedServers,
  appConfig,
  project,
  location,
  dataset,
  dicomStore
) => {
  // update state from url available only when gcloud on
  if (!appConfig.enableGoogleCloudAdapter) {
    return false;
  }

  const serverHasChanged = previousServers !== servers && previousServers;

  // do not update from url. use state instead.
  if (serverHasChanged) {
    return false;
  }

  // if no valid urlbased servers
  if (!urlBasedServers || !urlBasedServers.length) {
    return false;
  } else if (!servers.length || !activeServer) {
    // no current valid server
    return true;
  }

  const newServer = urlBasedServers[0];

  let exists = servers.some(
    GoogleCloudUtilServers.isEqualServer.bind(undefined, newServer)
  );

  return !exists;
};

export default function useServer({
  project,
  location,
  dataset,
  dicomStore,
} = {}) {
  // Hooks
  const servers = useSelector(state => state && state.servers);
  const previousServers = usePrevious(servers);
  const dispatch = useDispatch();

  const { appConfig = {} } = useContext(AppContext);

  const activeServer = getActiveServer(servers);
  const urlBasedServers =
    getServers(appConfig, project, location, dataset, dicomStore) || [];
  const shouldUpdateServer = useServerFromUrl(
    servers.servers,
    previousServers,
    activeServer,
    urlBasedServers,
    appConfig,
    project,
    location,
    dataset,
    dicomStore
  );

  if (shouldUpdateServer) {
    setServers(dispatch, urlBasedServers);
  } else if (isValidServer(activeServer, appConfig)) {
    return activeServer;
  }
}
