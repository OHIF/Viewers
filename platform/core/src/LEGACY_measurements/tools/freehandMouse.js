const displayFunction = data => {
  let meanValue = '';
  if (data.meanStdDev && data.meanStdDev.mean && !isNaN(data.meanStdDev.mean)) {
    meanValue = data.meanStdDev.mean.toFixed(2) + ' HU';
  }
  return meanValue;
};

export const freehandMouse = {
  id: 'FreehandMouse',
  name: 'Freehand',
  toolGroup: 'allTools',
  cornerstoneToolType: 'FreehandMouse',
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
