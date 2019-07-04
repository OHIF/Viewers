const displayFunction = data => {
  if (data.shortestDiameter) {
    // TODO: Make this check criteria again to see if we should display shortest x longest
    return data.longestDiameter + ' x ' + data.shortestDiameter;
  }

  return data.longestDiameter;
};

export const bidirectional = {
  id: 'Bidirectional',
  name: 'Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Bidirectional',
  options: {
    measurementTable: {
      displayFunction,
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
