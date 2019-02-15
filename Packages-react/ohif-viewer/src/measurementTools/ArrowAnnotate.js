const displayFunction = data => {
  return data.text || '';
};

export default {
  id: 'ArrowAnnotate',
  name: 'ArrowAnnotate',
  toolGroup: 'allTools',
  cornerstoneToolType: 'ArrowAnnotate',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
