const getServers = (data, name) => {
  const { wadoUriRoot, qidoRoot, wadoRoot } = data;

  return [
    {
      name: name,
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
