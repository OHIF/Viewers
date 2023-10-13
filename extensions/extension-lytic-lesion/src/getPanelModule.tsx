import React from 'react';
import {
  WrappedPanelStudyBrowser,
  PanelMeasurementTable,
  PanelPetSUV,
  PanelROIThresholdSegmentation,
  HounsfieldRangeSelector,
  WindowLevelPanel,
  PanelSegmentation,
  SegmentationToolbox
} from './Panels';
import { useAppConfig } from '@state';
// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const { customizationService } = servicesManager.services;
  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();
    const { customizationService } = servicesManager.services;

    const disableEditingForMode = customizationService.get('segmentation.disableEditing');

    return (
      <PanelSegmentation
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
  const wrappedPanelSegmentationWithTools = configuration => {
    const [appConfig] = useAppConfig();
    return (
      <>
        {/* <SegmentationToolbox
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...configuration,
          }}
        /> */}
        <PanelSegmentation
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
  const wrappedMeasurementPanel = () => {
    return (
      <PanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };
  const wrappedPanelPetSuv = () => {
    return (
      <PanelPetSUV
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  const wrappedROIThresholdSeg = () => {
    return (
      <PanelROIThresholdSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };
  const wrappedHounsfieldUnitRange = () => {
    return (
      <HounsfieldRangeSelector
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };
  const wrappedWindowLevelPane = () => {
    return (
      <WindowLevelPanel
        commandsManager={commandsManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
      />
    )
  }
  return [
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: WrappedPanelStudyBrowser.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
    {
      name: 'measure',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurements',
      secondaryLabel: 'Measurements',
      component: wrappedMeasurementPanel,
    },
    {
      name: 'petSUV',
      iconName: 'tab-patient-info',
      iconLabel: 'PET SUV',
      label: 'PET SUV',
      component: wrappedPanelPetSuv,
      context: 'LYTIC',
    },
    {
      name: 'ROIThresholdSeg',
      iconName: 'tab-roi-threshold',
      iconLabel: 'ROI Threshold',
      label: 'ROI Threshold',
      component: wrappedROIThresholdSeg,
      context: 'LYTIC',
    },
    {
      name: 'HounsfieldRangeSelector',
      iconName: 'tab-roi-threshold',
      iconLabel: 'Hounsfield Range',
      label: 'Hounsfield Range',
      component: wrappedHounsfieldUnitRange,
      context: 'LYTIC',
    },
    {
      name: 'WindowLevelPane',
      iconName: 'tab-roi-threshold',
      iconLabel: 'Window Level',
      label: 'Window Level',
      component: wrappedWindowLevelPane,
      context: 'LYTIC',
    },
    {
      name: 'panelSegmentation',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentation,
      context: 'LYTIC',
    },
    {
      name: 'panelSegmentationWithTools',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationWithTools,
      context: 'LYTIC',
    },
  ];
}

export default getPanelModule;
