import setLayoutAndViewportPanes from './setLayoutAndViewportPanes.js';

/**
 * Sets our redux layout and viewport panes.
 * AfterCreation hook is called in `ConnectedVTKViewport` component
 * to save a copy of VTK's God Object -- allows us to make viewport
 * specific API calls.
 *
 * @export
 * @param {*} viewportPane
 * @returns
 */
export default function setMPRLayout(viewportPane) {
  console.log('set mpr layout', viewportPane);
  return new Promise((resolve, reject) => {
    const apis = [null, null, null];
    const viewportPaneCreator = index => {
      return {
        plugin: 'vtk',
        vtk: {
          mode: 'mpr', // TODO: not used
          afterCreation: api => {
            apis[index] = api;
            console.log(`API ${index} ADDED!`, api);

            if (apis.every(a => !!a)) {
              console.log('resolving setMPRLayout...');
              resolve(apis);
            }
          },
        },
      };
    };

    const vtkViewportPane1 = Object.assign(
      {},
      viewportPane,
      viewportPaneCreator(0)
    );
    const vtkViewportPane2 = Object.assign(
      {},
      viewportPane,
      viewportPaneCreator(1)
    );
    const vtkViewportPane3 = Object.assign(
      {},
      viewportPane,
      viewportPaneCreator(2)
    );

    const viewports = {
      numRows: 1,
      numColumns: 3,
      viewportPanes: [vtkViewportPane1, vtkViewportPane2, vtkViewportPane3],
    };

    setLayoutAndViewportPanes(viewports);
  });
}
