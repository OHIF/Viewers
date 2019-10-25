const getServers = (data, name) => {
  const {
    wadoUriRoot,
    qidoRoot,
    wadoRoot,
    dataset = '',
    dicomStore = '',
    location = '',
    project = '',
  } = data;

  return [
    {
      name: name,
      dataset,
      dicomStore,
      location,
      project,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      type: 'dicomWeb',
      active: true,
      wadoUriRoot,
      qidoRoot,
      wadoRoot,
      supportsFuzzyMatching: false,
      qidoSupportsIncludeField: false,
    },
  ];
};

const isValidServer = server => {
  return (
    server &&
    !!server.dataset &&
    !!server.dicomStore &&
    !!server.location &&
    !!server.project
  );
};

const isEqualServer = (server = {}, toCompare = {}) => {
  const serverLength = Object.keys(server).length;
  const toCompareLength = Object.keys(toCompare).length;

  if (!serverLength || !toCompareLength) {
    return false;
  }

  return (
    server.dataset === toCompare.dataset &&
    server.dataset === toCompare.dataset &&
    server.dicomStore === toCompare.dicomStore &&
    server.location === toCompare.location &&
    server.project === toCompare.project
  );
};

export { getServers, isValidServer, isEqualServer };
