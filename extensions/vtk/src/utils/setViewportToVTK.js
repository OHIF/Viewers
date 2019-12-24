import setLayoutAndViewportData from './setLayoutAndViewportData.js';

export default function setViewportToVTK(
  displaySet,
  viewportIndex,
  numRows,
  numColumns,
  layout,
  viewportSpecificData
) {
  return new Promise((resolve, reject) => {
    /*const currentData = layout.viewports[viewportIndex];
    if (currentData && currentData.plugin === 'vtk') {
      reject(new Error('Should not have reached this point??'));
    }*/

    const viewports = layout.viewports.slice();

    viewports[viewportIndex] = Object.assign({}, viewports[viewportIndex], {
      // plugin: 'vtk',
      vtk: {
        mode: 'mpr', // TODO: not used
        afterCreation: api => {
          resolve(api);
        },
      },
    });

    const updatedViewportData = viewportSpecificData;

    setLayoutAndViewportData(
      {
        numRows,
        numColumns,
        viewports,
      },
      updatedViewportData
    );
  });
}
