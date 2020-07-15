const displayFunction = data => {
  let meanValue = '';
  const { cachedStats } = data;
  if (cachedStats && cachedStats.mean && !isNaN(cachedStats.mean)) {
    meanValue = cachedStats.mean.toFixed(2) + ' HU';
  }
  return meanValue;
};

export const circleRoi = {
  id: 'CircleRoi',
  name: 'Circle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'CircleRoi',
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
