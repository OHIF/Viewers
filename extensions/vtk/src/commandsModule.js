import {
  vtkInteractorStyleMPRCrosshairs,
  vtkInteractorStyleMPRWindowLevel,
  vtkInteractorStyleMPRSlice,
  vtkSVGCrosshairsWidget,
  vtkSVGWidgetManager,
} from 'react-vtkjs-viewport';

import setMPRLayout from './utils/setMPRLayout.js';
import setViewportToVTK from './utils/setViewportToVTK.js';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants.js';

const { BlendMode } = Constants;

// TODO: Put this somewhere else
let apis = {};
let currentSlabThickness = 0.1;

function getCrosshairCallbackForIndex(index) {
  return ({ worldPos }) => {
    // Set camera focal point to world coordinate for linked views
    apis.forEach((api, viewportIndex) => {
      if (viewportIndex !== index) {
        // We are basically doing the same as getSlice but with the world coordinate
        // that we want to jump to instead of the camera focal point.
        // I would rather do the camera adjustment directly but I keep
        // doing it wrong and so this is good enough for now.
        const renderWindow = api.genericRenderWindow.getRenderWindow();

        const istyle = renderWindow.getInteractor().getInteractorStyle();
        const sliceNormal = istyle.getSliceNormal();
        const transform = vtkMatrixBuilder
          .buildFromDegree()
          .identity()
          .rotateFromDirections(sliceNormal, [1, 0, 0]);

        const mutatedWorldPos = worldPos.slice();
        transform.apply(mutatedWorldPos);
        const slice = mutatedWorldPos[0];

        istyle.setSlice(slice);

        renderWindow.render();
      }

      const renderer = api.genericRenderWindow.getRenderer();
      const wPos = vtkCoordinate.newInstance();
      wPos.setCoordinateSystemToWorld();
      wPos.setValue(worldPos);

      const displayPosition = wPos.getComputedDisplayValue(renderer);
      const { svgWidgetManager } = api;
      api.svgWidgets.crosshairsWidget.setPoint(
        displayPosition[0],
        displayPosition[1]
      );
      svgWidgetManager.render();
    });
  };
}

async function _getActiveViewportVTKApi(viewports) {
  const { layout, viewportSpecificData, activeViewportIndex } = viewports;

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
  const renderer = api.genericRenderWindow.getRenderer();
  const camera = renderer.getActiveCamera();
  const istyle = renderWindow.getInteractor().getInteractorStyle();
  istyle.setSliceNormal(...sliceNormal);
  camera.setViewUp(...viewUp);

  renderWindow.render();
}

function switchMPRInteractors(api, istyle) {
  const renderWindow = api.genericRenderWindow.getRenderWindow();
  const renderer = api.genericRenderWindow.getRenderer();
  const camera = renderer.getActiveCamera();
  const currentIStyle = renderWindow.getInteractor().getInteractorStyle();

  let currentNormal;
  if (currentIStyle.getSliceNormal && istyle.getSliceNormal) {
    currentNormal = currentIStyle.getSliceNormal();
  }

  let currentSlabThickness;
  if (currentIStyle.getSlabThickness && istyle.getSlabThickness) {
    currentSlabThickness = currentIStyle.getSlabThickness();
  }

  renderWindow.getInteractor().setInteractorStyle(istyle);

  // TODO: Not sure why this is required the second time this function is called
  istyle.setInteractor(renderWindow.getInteractor());

  if (istyle.getVolumeMapper() !== api.volumes[0]) {
    if (currentNormal) {
      istyle.setSliceNormal(currentNormal);
    }

    if (currentSlabThickness) {
      istyle.setSlabThickness(currentSlabThickness);
    }

    istyle.setVolumeMapper(api.volumes[0]);
  }
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
      const istyle = vtkInteractorStyleMPRSlice.newInstance();

      switchMPRInteractors(api, istyle);
    });
  },
  enableCrosshairsTool: () => {
    apis.forEach((api, index) => {
      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();

      switchMPRInteractors(api, istyle);

      istyle.setCallback(getCrosshairCallbackForIndex(index));
    });
  },
  enableLevelTool: () => {
    apis.forEach(api => {
      const istyle = vtkInteractorStyleMPRWindowLevel.newInstance();

      switchMPRInteractors(api, istyle);
    });
  },
  setSlabThickness: slabThickness => {
    currentSlabThickness = slabThickness;

    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const istyle = renderWindow.getInteractor().getInteractorStyle();

      if (istyle.setSlabThickness) {
        istyle.setSlabThickness(currentSlabThickness);

        // TODO: Do this inside the interactors in a setSlabThickness function instead
        const renderer = api.genericRenderWindow.getRenderer();
        const camera = renderer.getActiveCamera();
        const dist = camera.getDistance();
        const near = dist - currentSlabThickness / 2;
        const far = dist + currentSlabThickness / 2;

        camera.setClippingRange(near, far);
      }

      renderWindow.render();
    });
  },
  changeSlabThickness: ({ change }) => {
    currentSlabThickness += change;
    currentSlabThickness = Math.max(currentSlabThickness, 0.1);

    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const istyle = renderWindow.getInteractor().getInteractorStyle();

      if (istyle.setSlabThickness) {
        istyle.setSlabThickness(currentSlabThickness);
      }

      renderWindow.render();
    });
  },
  setBlendMode: ({ blendMode }) => {
    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const istyle = renderWindow.getInteractor().getInteractorStyle();

      api.volumes[0].getMapper().setBlendMode(blendMode);

      renderWindow.render();
    });
  },
  mpr2d: async ({ viewports }) => {
    const displaySet =
      viewports.viewportSpecificData[viewports.activeViewportIndex];

    let apiByViewport;
    try {
      apiByViewport = await setMPRLayout(displaySet);
    } catch (error) {
      throw new Error(error);
    }

    apis = apiByViewport;

    /*const rgbTransferFunction = apiByViewport[0].volumes[0]
      .getProperty()
      .getRGBTransferFunction(0);
    rgbTransferFunction.onModified(() => {
      apiByViewport.forEach(a => {
        const renderWindow = a.genericRenderWindow.getRenderWindow();

        renderWindow.render();
      });
    });*/

    apiByViewport.forEach((api, index) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const renderer = api.genericRenderWindow.getRenderer();
      const camera = renderer.getActiveCamera();

      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();
      renderWindow.getInteractor().setInteractorStyle(istyle);

      istyle.setVolumeMapper(api.volumes[0]);
      istyle.setCallback(getCrosshairCallbackForIndex(index));

      const svgWidgetManager = vtkSVGWidgetManager.newInstance();
      svgWidgetManager.setRenderer(renderer);
      svgWidgetManager.setScale(1);

      const crosshairsWidget = vtkSVGCrosshairsWidget.newInstance();

      svgWidgetManager.addWidget(crosshairsWidget);
      svgWidgetManager.render();

      api.svgWidgetManager = svgWidgetManager;
      api.svgWidgets = {
        crosshairsWidget,
      };

      switch (index) {
        default:
        case 0:
          //Axial
          istyle.setSliceNormal(0, 0, 1);
          camera.setViewUp(0, -1, 0);

          break;
        case 1:
          // sagittal
          istyle.setSliceNormal(1, 0, 0);
          camera.setViewUp(0, 0, 1);
          break;
        case 2:
          // Coronal
          istyle.setSliceNormal(0, 1, 0);
          camera.setViewUp(0, 0, 1);
          break;
      }

      renderWindow.render();
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
    commandFn: actions.setBlendMode,
    storeContexts: [],
    options: { blendMode: BlendMode.COMPOSITE_BLEND },
  },
  setBlendModeToMaximumIntensity: {
    commandFn: actions.setBlendMode,
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
