import init from './init.js';
import toolbarModule from './toolbarModule.js';
// import panelModule from './panelModule.js';
import MRUrographyPanel from './components/MRUrographyPanel.js';
import { MRUrographyLabellingData } from './constants/labels';
// Can fix this when Measurements panel is module/plugable/configurable.
import { SelectTree } from '@ohif/ui';

// TEMP
import './utils/calculateAreaUnderCurve';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'com.ohif.kinderspital-mr-urography',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getToolbarModule({ servicesManager }) {
    return toolbarModule;
  },
  getPanelModule({ servicesManager }) {
    const { UIDialogService } = servicesManager.services;

    const showLabellingDialog = (props, measurementData, onLabelCallback) => {
      if (!UIDialogService) {
        console.warn('Unable to show dialog; no UI Dialog Service available.');
        return;
      }

      const dialogId = 'mrUrographylabelling';

      UIDialogService.dismiss({ id: dialogId });
      UIDialogService.create({
        id: dialogId,
        centralize: true,
        isDraggable: false,
        showOverlay: true,
        content: SelectTree,
        contentProps: {
          onSelected: (evt, item) => {
            console.log('labellingDoneCallback');

            console.log(measurementData);
            console.log(onLabelCallback);

            measurementData.label = item.label;

            onLabelCallback(measurementData);

            UIDialogService.dismiss({ id: dialogId });
          },
          items: MRUrographyLabellingData,
          columns: 1,
          selectTreeFirstTitle: 'Assign Label',
          ...props,
        },
      });

      /*
            UIDialogService.create({
        id: 'labelling',
        centralize: true,
        isDraggable: false,
        showOverlay: true,
        content: LabellingFlow,
        labellingData: labels,
        editDescriptionOnDialog: false,
        contentProps: {
          measurementData,
          labellingDoneCallback: () => {
            console.log('labellingDoneCallback');
          },
          updateLabelling: ({ location, description, response }) => {
            console.log('TODO: Update labelling');

            debugger;
          },
          ...props,
        },
      });
      */
    };

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Urography',
          target: 'kinderspital-mr-urography-panel',
          isDisabled: studies => {
            const pathname = window.location.pathname;

            if (!pathname.includes('mrUrography')) {
              return true;
            }

            return false;
          },
        },
      ],
      components: [
        {
          id: 'kinderspital-mr-urography-panel',
          component: ({ studies, viewports, activeIndex, isOpen }) => {
            return MRUrographyPanel({
              studies,
              viewports,
              activeIndex,
              isOpen,
              showLabellingDialog,
            });
          },
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
