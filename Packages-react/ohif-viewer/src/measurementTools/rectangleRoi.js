const displayFunction = data => {
  let meanValue = '';
  if (data.meanStdDev && data.meanStdDev.mean) {
    meanValue = data.meanStdDev.mean.toFixed(2) + ' HU';
  }
  return meanValue;
};

export default {
  id: 'RectangleRoi',
  name: 'Rectangle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'RectangleRoi',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
