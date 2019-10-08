export default function setViewportToVTK(
  viewportPane,
  viewportIndex,
  viewportPanes
) {
  console.log('set viewport to vtk');
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

    console.warn('HELP!!!!!');
    resolve();

    // const updatedViewports = setSingleLayoutData(
    //   viewportPanes,
    //   viewportIndex,
    //   data
    // );

    // const updatedViewportData = viewportPane;

    // TODO:
    // setLayoutAndViewportData(
    //   { viewports: updatedViewports },
    //   updatedViewportData
    // );
  });
}
