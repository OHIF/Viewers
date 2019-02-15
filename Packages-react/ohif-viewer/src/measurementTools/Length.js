const displayFunction = data => {
  let lengthValue = '';
  if (data.length) {
    lengthValue = data.length.toFixed(2) + ' mm';
  }
  return lengthValue;
};

export default {
  id: 'Length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Length',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
