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

export { getServers };
