import { ToolbarService } from '@ohif/core';

import { id } from './id';
import {
  mode as baseMode,
  modeInstance as baseModeInstance,
  basicRoute as baseRoute,
  onModeEnter as baseOnModeEnter,
  basicLayout,
  toolbarSections,
} from '@ohif/mode-basic';

const { TOOLBAR_SECTIONS } = ToolbarService;

const version = process.env.VERSION_NUMBER || '0.0.0';

const basicRoute = {
  ...baseRoute,
  layoutInstance: {
    ...basicLayout,
    props: {
      ...basicLayout.props,
      leftPanels: [...basicLayout.props.rightPanels],
      rightPanels: [...basicLayout.props.leftPanels],
    },
  },
};

function onModeEnter(...args) {
  baseOnModeEnter.apply(this, args);

  const { servicesManager } = args[0];
  const { customizationService } = servicesManager.services;

  customizationService.setCustomizations({
    'viewportOverlay.topRight': {
      $set: [
        {
          id: 'AppVersion',
          inheritsFrom: 'ohif.overlayItem',
          label: '',
          title: 'App Version',
          contentF() {
            return version;
          },
        },
      ],
    },
  });
}

export const modeInstance = {
  ...baseModeInstance,
  id,
  routeName: 'yurii-test',
  displayName: 'Yurii Test',
  routes: [basicRoute],
  onModeEnter,
  toolbarSections: {
    ...toolbarSections,
    [TOOLBAR_SECTIONS.primary]: ['Angle', ...toolbarSections[TOOLBAR_SECTIONS.primary]],
    MoreTools: toolbarSections.MoreTools.filter(tool => tool !== 'Angle'),
  },
};

export const mode = {
  ...baseMode,
  id,
  modeInstance,
};

export default mode;
