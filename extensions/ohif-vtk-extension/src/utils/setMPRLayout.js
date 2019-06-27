import setLayoutAndViewportData from './setLayoutAndViewportData.js';
import setSingleLayoutData from './setSingleLayoutData.js';

export default function setMPRLayout(displaySet) {
  return new Promise((resolve, reject) => {
    let viewports = [];
    const rows = 1;
    const columns = 3;
    const numViewports = rows * columns;
    const viewportSpecificData = {};
    for (let i = 0; i < numViewports; i++) {
      viewports.push({
        height: `${100 / rows}%`,
        width: `${100 / columns}%`,
      });

      viewportSpecificData[i] = displaySet;
      viewportSpecificData[i].plugin = 'vtk';
    }
    const layout = {
      viewports,
    };

    const viewportIndices = [0, 1, 2];
    let updatedViewports = layout.viewports;

    const apis = [];
    viewportIndices.forEach(viewportIndex => {
      apis[viewportIndex] = null;
      /*const currentData = layout.viewports[viewportIndex];
      if (currentData && currentData.plugin === 'vtk') {
        reject(new Error('Should not have reached this point??'));
      }*/

      const data = {
        // plugin: 'vtk',
        vtk: {
          mode: 'mpr', // TODO: not used
          afterCreation: api => {
            apis[viewportIndex] = api;

            if (apis.every(a => !!a)) {
              resolve(apis);
            }
          },
        },
      };

      updatedViewports = setSingleLayoutData(
        updatedViewports,
        viewportIndex,
        data
      );
    });

    setLayoutAndViewportData(
      { viewports: updatedViewports },
      viewportSpecificData
    );
  });
}
