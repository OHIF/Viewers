import {
  vtkInteractorStyleMPRCrosshairs,
  vtkInteractorStyleMPRWindowLevel,
  vtkInteractorStyleMPRSlice,
  vtkInteractorStyleMPRRotate,
  vtkSVGCrosshairsWidget,
} from 'react-vtkjs-viewport';

import setMPRLayout from './utils/setMPRLayout.js';
import setViewportToVTK from './utils/setViewportToVTK.js';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants.js';
import throttle from 'lodash.throttle';

const { BlendMode } = Constants;

// TODO: Put this somewhere else
let apis = {};

async function _getActiveViewportVTKApi(viewports) {
  const {
    numRows,
    numColumns,
    layout,
    viewportSpecificData,
    activeViewportIndex,
  } = viewports;

  const currentData = layout.viewports[activeViewportIndex];
  if (currentData && currentData.plugin === 'vtk') {
    // TODO: I was storing/pulling this from Redux but ran into weird issues
    if (apis[activeViewportIndex]) {
      return apis[activeViewportIndex];
    }
  }

  const displaySet = viewportSpecificData[activeViewportIndex];

  let api;
  if (!api) {
    try {
      api = await setViewportToVTK(
        displaySet,
        activeViewportIndex,
        numRows,
        numColumns,
        layout,
        viewportSpecificData
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  return api;
}

function _setView(api, sliceNormal, viewUp) {
  const renderWindow = api.genericRenderWindow.getRenderWindow();
  const istyle = renderWindow.getInteractor().getInteractorStyle();
  istyle.setSliceNormal(...sliceNormal);
  istyle.setViewUp(...viewUp);

  renderWindow.render();
}

const actions = {
  axial: async ({ viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [0, 0, 1], [0, -1, 0]);
  },
  sagittal: async ({ viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [1, 0, 0], [0, 0, 1]);
  },
  coronal: async ({ viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [0, 1, 0], [0, 0, 1]);
  },
  enableRotateTool: () => {
    apis.forEach(api => {
      const istyle = vtkInteractorStyleMPRRotate.newInstance();

      api.setInteractorStyle({ istyle });
    });
  },
  enableCrosshairsTool: () => {
    apis.forEach((api, apiIndex) => {
      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();

      api.setInteractorStyle({
        istyle,
        configuration: { apis, apiIndex },
      });
    });
  },
  enableLevelTool: () => {
    function updateVOI(apis, windowWidth, windowCenter) {
      apis.forEach(api => {
        api.updateVOI(windowWidth, windowCenter);
      });
    }

    const throttledUpdateVOIs = throttle(updateVOI, 16, { trailing: true }); // ~ 60 fps

    const callbacks = {
      setOnLevelsChanged: ({ windowCenter, windowWidth }) => {
        apis.forEach(api => {
          const renderWindow = api.genericRenderWindow.getRenderWindow();

          renderWindow.render();
        });

        throttledUpdateVOIs(apis, windowWidth, windowCenter);
      },
    };

    apis.forEach(api => {
      const istyle = vtkInteractorStyleMPRWindowLevel.newInstance();

      api.setInteractorStyle({ istyle, callbacks });
    });
  },
  setSlabThickness: ({ slabThickness }) => {
    apis.forEach(api => {
      api.setSlabThickness(slabThickness);
    });
  },
  changeSlabThickness: ({ change }) => {
    apis.forEach(api => {
      const slabThickness = Math.max(api.getSlabThickness() + change, 0.1);

      api.setSlabThickness(slabThickness);
    });
  },
  setBlendModeToComposite: () => {
    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const istyle = renderWindow.getInteractor().getInteractorStyle();

      const slabThickness = api.getSlabThickness();

      const mapper = api.volumes[0].getMapper();
      if (mapper.setBlendModeToComposite) {
        mapper.setBlendModeToComposite();
      }

      if (istyle.setSlabThickness) {
        istyle.setSlabThickness(slabThickness);
      }
      renderWindow.render();
    });
  },
  setBlendModeToMaximumIntensity: () => {
    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const mapper = api.volumes[0].getMapper();
      if (mapper.setBlendModeToMaximumIntensity) {
        mapper.setBlendModeToMaximumIntensity();
      }
      renderWindow.render();
    });
  },
  setBlendMode: ({ blendMode }) => {
    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();

      api.volumes[0].getMapper().setBlendMode(blendMode);

      renderWindow.render();
    });
  },
  mpr2d: async ({ viewports }) => {
    // TODO push a lot of this backdoor logic lower down to the library level.
    const displaySet =
      viewports.viewportSpecificData[viewports.activeViewportIndex];

    // Get current VOI if cornerstone viewport.
    const cornerstoneVOI = getVOIFromCornerstoneViewport(displaySet);

    const viewportProps = [
      {
        //Axial
        orientation: {
          sliceNormal: [0, 0, 1],
          viewUp: [0, -1, 0],
        },
      },
      {
        // Sagital
        orientation: {
          sliceNormal: [1, 0, 0],
          viewUp: [0, 0, 1],
        },
      },
      {
        // Coronal
        orientation: {
          sliceNormal: [0, 1, 0],
          viewUp: [0, 0, 1],
        },
      },
    ];

    try {
      apis = await setMPRLayout(displaySet, viewportProps, 1, 3);
    } catch (error) {
      throw new Error(error);
    }

    if (cornerstoneVOI) {
      setVOI(cornerstoneVOI);
    }

    // Add widgets and set default interactorStyle of each viewport.
    apis.forEach((api, apiIndex) => {
      api.addSVGWidget(
        vtkSVGCrosshairsWidget.newInstance(),
        'crosshairsWidget'
      );

      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();

      api.setInteractorStyle({
        istyle,
        configuration: { apis, apiIndex },
      });
    });
  },
};

window.vtkActions = actions;

const definitions = {
  axial: {
    commandFn: actions.axial,
    storeContexts: ['viewports'],
    options: {},
  },
  coronal: {
    commandFn: actions.coronal,
    storeContexts: ['viewports'],
    options: {},
  },
  sagittal: {
    commandFn: actions.sagittal,
    storeContexts: ['viewports'],
    options: {},
  },
  enableRotateTool: {
    commandFn: actions.enableRotateTool,
    storeContexts: [],
    options: {},
  },
  enableCrosshairsTool: {
    commandFn: actions.enableCrosshairsTool,
    storeContexts: [],
    options: {},
  },
  enableLevelTool: {
    commandFn: actions.enableLevelTool,
    storeContexts: [],
    options: {},
  },
  setBlendModeToComposite: {
    commandFn: actions.setBlendModeToComposite,
    storeContexts: [],
    options: { blendMode: BlendMode.COMPOSITE_BLEND },
  },
  setBlendModeToMaximumIntensity: {
    commandFn: actions.setBlendModeToMaximumIntensity,
    storeContexts: [],
    options: { blendMode: BlendMode.MAXIMUM_INTENSITY_BLEND },
  },
  setBlendModeToMinimumIntensity: {
    commandFn: actions.setBlendMode,
    storeContexts: [],
    options: { blendMode: BlendMode.MINIMUM_INTENSITY_BLEND },
  },
  setBlendModeToAverageIntensity: {
    commandFn: actions.setBlendMode,
    storeContexts: [],
    options: { blendMode: BlendMode.AVERAGE_INTENSITY_BLEND },
  },
  setSlabThickness: {
    // TODO: How do we pass in a function argument?
    commandFn: actions.setSlabThickness,
    storeContexts: [],
    options: {},
  },
  increaseSlabThickness: {
    commandFn: actions.changeSlabThickness,
    storeContexts: [],
    options: {
      change: 3,
    },
  },
  decreaseSlabThickness: {
    commandFn: actions.changeSlabThickness,
    storeContexts: [],
    options: {
      change: -3,
    },
  },
  mpr2d: {
    commandFn: actions.mpr2d,
    storeContexts: ['viewports'],
    options: {},
    context: 'VIEWER',
  },
};

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::VTK',
};

function getVOIFromCornerstoneViewport(displaySet) {
  const cornerstoneElement = cornerstone.getEnabledElement(displaySet.dom);

  if (cornerstoneElement) {
    const imageId = cornerstoneElement.image.imageId;

    const { modality } = cornerstone.metaData.get(
      'generalSeriesModule',
      imageId
    );

    if (modality !== 'PT') {
      const { windowWidth, windowCenter } = cornerstoneElement.viewport.voi;

      return {
        windowWidth,
        windowCenter,
      };
    }
  }
}

function setVOI(voi) {
  const { windowWidth, windowCenter } = voi;
  const lower = windowCenter - windowWidth / 2.0;
  const upper = windowCenter + windowWidth / 2.0;

  const rgbTransferFunction = apis[0].volumes[0]
    .getProperty()
    .getRGBTransferFunction(0);

  rgbTransferFunction.setRange(lower, upper);

  apis.forEach(api => {
    api.updateVOI(windowWidth, windowCenter);
  });
}
