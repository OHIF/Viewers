import setLayoutAndViewportData from './setLayoutAndViewportData.js';
import setSingleLayoutData from './setSingleLayoutData.js';

export default function setViewportToVTK(
  displaySet,
  viewportIndex,
  layout,
  viewportSpecificData
) {
  return new Promise((resolve, reject) => {
    /*const currentData = layout.viewports[viewportIndex];
    if (currentData && currentData.plugin === 'vtk') {
      reject(new Error('Should not have reached this point??'));
    }*/

    const data = {
      // plugin: 'vtk',
      vtk: {
        mode: 'mpr', // TODO: not used
        afterCreation: api => {
          resolve(api);
        },
      },
    };

    const updatedViewports = setSingleLayoutData(
      layout.viewports,
      viewportIndex,
      data
    );

    const updatedViewportData = viewportSpecificData;

    setLayoutAndViewportData(
      { viewports: updatedViewports },
      updatedViewportData
    );
  });
}
