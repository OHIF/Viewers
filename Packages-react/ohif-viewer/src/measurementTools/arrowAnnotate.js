const displayFunction = data => {
  return data.text || '';
};

export default {
  id: 'arrowAnnotate',
  name: 'ArrowAnnotate',
  toolGroup: 'allTools',
  cornerstoneToolType: 'arrowAnnotate',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
