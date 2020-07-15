export const targetUN = {
  id: 'TargetUN',
  name: 'UN Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'TargetUN',
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
