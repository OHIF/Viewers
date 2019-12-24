export const targetCR = {
  id: 'TargetCR',
  name: 'CR Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'TargetCR',
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
