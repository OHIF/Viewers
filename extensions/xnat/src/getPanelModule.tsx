import React from 'react';
import { WrappedPanelStudyBrowser, WrappedXNATNavigationPanel, WrappedXNATStudyBrowserPanel } from './Panels';
import i18n from 'i18next';
import XNATSegmentationPanel from './Panels/XNATSegmentationPanel';
import XNATPanelMeasurement from './Panels/XNATPanelMeasurement';
import { useAppConfig } from '@state';
import { Toolbox } from '@ohif/extension-default';
import ActiveViewportWindowLevel from '@ohif/extension-cornerstone';
import { Types } from '@ohif/core';
import XNATCustomFormsPanel from './Panels/XNATCustomFormsPanel';


function getPanelModule({ commandsManager, extensionManager, servicesManager }) {

  const { customizationService } = servicesManager.services;

  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();

    const disableEditingForMode = customizationService.getCustomization('segmentation.disableEditing');

    return (
      <XNATSegmentationPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing || disableEditingForMode?.value,
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = ({ configuration }) => {
    const { toolbarService } = servicesManager.services;

    return (
      <>
        <Toolbox
          buttonSectionId={toolbarService.sections.segmentationToolbox}
          title="Segmentation Tools"
        />
        <XNATSegmentationPanel
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...configuration,
          }}
        />
      </>
    );
  };

  return [
    {
      name: 'activeViewportWindowLevel',
      component: () => {
        return <ActiveViewportWindowLevel servicesManager={servicesManager} />;
      },
    },
    {
      name: 'xnatNavigation',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: props => (
        <WrappedXNATNavigationPanel
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },
    {
      name: 'xnatStudyBrowser',
      iconName: 'tab-studies',
      iconLabel: 'XNAT Studies',
      label: i18n.t('SidePanel:XNAT Studies'),
      component: props => (
        <WrappedXNATStudyBrowserPanel
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },
    {
      name: 'panelSegmentation',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentation,
    },
    {
      name: 'panelSegmentationWithTools',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationWithTools,
    },
    {
      name: 'xnatMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Measurements',
      label: 'Measurements',
      component: XNATPanelMeasurement,
    },
    {
      name: 'xnatCustomForms',
      iconName: 'tab-custom-forms',
      iconLabel: 'Custom Forms',
      label: 'Custom Forms',
      component: props => (
        <XNATCustomFormsPanel
          {...props}
          servicesManager={servicesManager}
        />
      ),
    },
  ];
}

export default getPanelModule;
