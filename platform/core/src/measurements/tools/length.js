const displayFunction = data => {
  let lengthValue = '';
  if (data.length) {
    lengthValue = Number(data.length).toFixed(2) + ' mm';
  }
  return lengthValue;
};

export const length = {
  id: 'Length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Length',
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
