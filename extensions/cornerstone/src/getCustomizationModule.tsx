import viewportOverlayCustomization from './customizations/viewportOverlayCustomization';
import getSegmentationPanelCustomization from './customizations/segmentationPanelCustomization';
import layoutSelectorCustomization from './customizations/layoutSelectorCustomization';
import viewportToolsCustomization from './customizations/viewportToolsCustomization';
import viewportClickCommandsCustomization from './customizations/viewportClickCommandsCustomization';
import measurementsCustomization from './customizations/measurementsCustomization';
import volumeRenderingCustomization from './customizations/volumeRenderingCustomization';
import colorbarCustomization from './customizations/colorbarCustomization';
import windowLevelPresetsCustomization from './customizations/windowLevelPresetsCustomization';
import miscCustomization from './customizations/miscCustomization';
import captureViewportModalCustomization from './customizations/captureViewportModalCustomization';
import viewportDownloadWarningCustomization from './customizations/viewportDownloadWarningCustomization';
import viewportActionMenuCustomizations from './customizations/viewportActionMenuCustomizations';

function getCustomizationModule({ commandsManager, servicesManager }) {
  return [
    {
      name: 'default',
      value: {
        ...viewportOverlayCustomization,
        ...getSegmentationPanelCustomization({ commandsManager, servicesManager }),
        ...layoutSelectorCustomization,
        ...viewportToolsCustomization,
        ...viewportClickCommandsCustomization,
        ...measurementsCustomization,
        ...volumeRenderingCustomization,
        ...colorbarCustomization,
        ...windowLevelPresetsCustomization,
        ...miscCustomization,
        ...captureViewportModalCustomization,
        ...viewportDownloadWarningCustomization,
        ...viewportActionMenuCustomizations,
      },
    },
  ];
}

export default getCustomizationModule;
