const displayFunction = data => {
  let text = '';
  if (data.rAngle) {
    text = data.rAngle.toFixed(2) + String.fromCharCode(parseInt('00B0', 16));
  }
  return text;
};

export default {
  id: 'SimpleAngle',
  name: 'SimpleAngle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'SimpleAngle',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
