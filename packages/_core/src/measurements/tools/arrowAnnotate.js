const displayFunction = data => {
  return data.text || '';
};

export const arrowAnnotate = {
  id: 'ArrowAnnotate',
  name: 'ArrowAnnotate',
  toolGroup: 'allTools',
  cornerstoneToolType: 'ArrowAnnotate',
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
