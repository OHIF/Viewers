import React from 'react';
import { useTranslation } from 'react-i18next';
import { Toolbox } from '@ohif/extension-default';
import PanelSegmentation from './panels/PanelSegmentation';
import ActiveViewportWindowLevel from './components/ActiveViewportWindowLevel';
import PanelMeasurement from './panels/PanelMeasurement';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import i18n from '@ohif/i18n';

const getPanelModule = ({ commandsManager, servicesManager, extensionManager }: withAppTypes) => {
  const { toolbarService } = servicesManager.services;

  const toolSectionMap = {
    [SegmentationRepresentations.Labelmap]: toolbarService.sections.labelMapSegmentationToolbox,
    [SegmentationRepresentations.Contour]: toolbarService.sections.contourSegmentationToolbox,
  };

  const wrappedPanelSegmentation = props => {
    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...props?.configuration,
        }}
        segmentationRepresentationTypes={props?.segmentationRepresentationTypes}
      />
    );
  };

  const wrappedPanelSegmentationNoHeader = props => {
    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...props?.configuration,
        }}
        segmentationRepresentationTypes={props?.segmentationRepresentationTypes}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = props => {
    const { t } = useTranslation('SegmentationPanel');
    const tKey = `${props.segmentationRepresentationTypes?.[0] ?? 'Segmentation'} tools`;
    const tValue = t(tKey);

    return (
      <>
        <Toolbox
          buttonSectionId={toolSectionMap[props.segmentationRepresentationTypes?.[0]]}
          title={tValue}
        />
        <PanelSegmentation
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...props?.configuration,
          }}
          segmentationRepresentationTypes={props?.segmentationRepresentationTypes}
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
      name: 'panelMeasurement',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurement',
      component: PanelMeasurement,
    },
    {
      name: 'panelSegmentation',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentation,
    },
    {
      name: 'panelSegmentationNoHeader',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationNoHeader,
    },
    {
      name: 'panelSegmentationWithToolsLabelMap',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: i18n.t('SegmentationPanel:Labelmap'),
      component: props =>
        wrappedPanelSegmentationWithTools({
          ...props,
          segmentationRepresentationTypes: [
            SegmentationRepresentations.Labelmap,
            SegmentationRepresentations.Surface,
          ],
        }),
    },
    {
      name: 'panelSegmentationWithToolsContour',
      iconName: 'tab-contours',
      iconLabel: 'Segmentation',
      label: i18n.t('SegmentationPanel:Contour'),
      component: props =>
        wrappedPanelSegmentationWithTools({
          ...props,
          segmentationRepresentationTypes: [SegmentationRepresentations.Contour],
        }),
    },
  ];
};

export default getPanelModule;
