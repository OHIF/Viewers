import React from 'react';
import { PanelPetSUV, PanelROIThresholdExport } from './Panels';
import { Toolbox as NewToolbox } from '@ohif/ui-next';
import { Toolbox as OldToolbox } from '@ohif/ui';
import { useAppConfig } from '@state';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrappedPanelPetSuv = ({ renderHeader, getCloseIcon, tab }) => {
    return (
      <PanelPetSUV
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        renderHeader={renderHeader}
        getCloseIcon={getCloseIcon}
        tab={tab}
      />
    );
  };

  const wrappedROIThresholdToolbox = ({ renderHeader, getCloseIcon, tab }: withAppTypes) => {
    const [appConfig] = useAppConfig();

    const Toolbox = appConfig.useExperimentalUI ? NewToolbox : OldToolbox;

    return (
      <>
        <Toolbox
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          buttonSectionId="ROIThresholdToolbox"
          title="Threshold Tools"
          renderHeader={renderHeader}
          getCloseIcon={getCloseIcon}
          tab={tab}
        />
      </>
    );
  };

  const wrappedROIThresholdExport = () => {
    return (
      <>
        <PanelROIThresholdExport
          commandsManager={commandsManager}
          servicesManager={servicesManager}
        />
      </>
    );
  };

  return [
    {
      name: 'petSUV',
      iconName: 'tab-patient-info',
      iconLabel: 'Patient Info',
      label: 'Patient Info',
      component: wrappedPanelPetSuv,
    },
    {
      name: 'tmtvBox',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation Toolbox',
      component: wrappedROIThresholdToolbox,
    },
    {
      name: 'tmtvExport',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation Export',
      component: wrappedROIThresholdExport,
    },
  ];
}

export default getPanelModule;
