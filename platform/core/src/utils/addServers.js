// TODO: figure out where else to put this function
const addServers = (servers, store) => {
  if (!servers || !store) {
    throw new Error('The servers and store must be defined');
  }

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
};

export default addServers;
