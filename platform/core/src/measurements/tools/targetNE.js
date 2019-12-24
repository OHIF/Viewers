export const targetNE = {
  id: 'TargetNE',
  name: 'NE Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'TargetNE',
  options: {
    measurementTable: {
      displayFunction: data => data.response,
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
