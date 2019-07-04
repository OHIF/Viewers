// TODO: figure out where else to put this function
export default function addServers(servers, store) {
  Object.keys(servers).forEach(serverType => {
    const endpoints = servers[serverType];
    endpoints.forEach(endpoint => {
      const server = Object.assign({}, endpoint);
      server.type = serverType;

      store.dispatch({
        type: 'ADD_SERVER',
        server,
      });
    });
  });
}
