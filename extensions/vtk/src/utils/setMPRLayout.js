import setLayoutAndViewportData from './setLayoutAndViewportData.js';

export default function setMPRLayout(displaySet) {
  return new Promise((resolve, reject) => {
    const viewports = [];
    const numRows = 1;
    const numColumns = 3;
    const numViewports = numRows * numColumns;
    const viewportSpecificData = {};

    for (let i = 0; i < numViewports; i++) {
      viewports.push({});
      viewportSpecificData[i] = displaySet;
      viewportSpecificData[i].plugin = 'vtk';
    }

    const apis = [];
    viewports.forEach((viewport, index) => {
      apis[index] = null;
      viewports[index] = Object.assign({}, viewports[index], {
        plugin: 'vtk',
        vtk: {
          mode: 'mpr', // TODO: not used
          afterCreation: api => {
            apis[index] = api;

            if (apis.every(a => !!a)) {
              resolve(apis);
            }
          },
        },
      });
    });

    setLayoutAndViewportData(
      {
        numRows,
        numColumns,
        viewports,
      },
      viewportSpecificData
    );
  });
}
