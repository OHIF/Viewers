const displayFunction = data => {
  let lengthValue = '';
  if (data.length) {
    lengthValue = data.length.toFixed(2) + ' mm';
  }
  return lengthValue;
};

export default {
  id: 'length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'length',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
