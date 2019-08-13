export const nonTarget = {
  id: 'NonTarget',
  name: 'Non-Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'NonTarget',
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
