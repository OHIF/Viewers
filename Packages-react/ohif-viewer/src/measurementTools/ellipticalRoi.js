const displayFunction = data => {
  let meanValue = '';
  if (data.meanStdDev && data.meanStdDev.mean) {
    meanValue = data.meanStdDev.mean.toFixed(2) + ' HU';
  }
  return meanValue;
  // let meanValue = data.meanStdDev && data.meanStdDev.mean || 0;
  // return numberWithCommas(meanValue).toFixed(2) + ' HU';
  //return data.meanStdDev.mean.toFixed(2);
};

export default {
  id: 'ellipticalRoi',
  name: 'Ellipse',
  toolGroup: 'allTools',
  cornerstoneToolType: 'ellipticalRoi',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
