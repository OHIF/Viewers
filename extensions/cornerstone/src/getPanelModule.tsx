import React from 'react';
import { useTranslation } from 'react-i18next';
import { Toolbox } from '@ohif/extension-default';
import PanelSegmentation from './panels/PanelSegmentation';
import ActiveViewportWindowLevel from './components/ActiveViewportWindowLevel';
import PanelMeasurement from './panels/PanelMeasurement';
import ServerSideSegmentationPanel from './panels/ServerSideSegmentationPanel';
import LocalSegmentationPanel from './panels/LocalSegmentationPanel';
import LocalSegmentation3DPanel from './panels/LocalSegmentation3DPanel';
import { PanelSection } from '@ohif/ui-next';
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
        segmentationRepresentationType={props?.segmentationRepresentationType}
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
        segmentationRepresentationType={props?.segmentationRepresentationType}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = props => {
    const { t } = useTranslation('SegmentationPanel');
    const tKey = `${props.segmentationRepresentationType ?? 'Segmentation'} tools`;
    const tValue = t(tKey);

    const isLabelmap = props.segmentationRepresentationType === SegmentationRepresentations.Labelmap;

    return (
      <>
        <Toolbox
          buttonSectionId={toolSectionMap[props.segmentationRepresentationType]}
          title={tValue}
        />
        {isLabelmap && (
          <>
            {/*<LocalSegmentation3DPanel*/}
            {/*  commandsManager={commandsManager}*/}
            {/*  servicesManager={servicesManager}*/}
            {/*  extensionManager={extensionManager}*/}
            {/*/>*/}
            {/*<LocalSegmentationPanel*/}
            {/*  commandsManager={commandsManager}*/}
            {/*  servicesManager={servicesManager}*/}
            {/*  extensionManager={extensionManager}*/}
            {/*/>*/}
            <PanelSection defaultOpen={false}>
              <PanelSection.Header>
                <span>Server-side segmentation</span>
              </PanelSection.Header>
              <PanelSection.Content>
                <ServerSideSegmentationPanel
                  commandsManager={commandsManager}
                  servicesManager={servicesManager}
                  extensionManager={extensionManager}
                  {...props}
                />
              </PanelSection.Content>
            </PanelSection>
          </>
        )}
        <PanelSegmentation
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...props?.configuration,
          }}
          segmentationRepresentationType={props?.segmentationRepresentationType}
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
          segmentationRepresentationType: SegmentationRepresentations.Labelmap,
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
          segmentationRepresentationType: SegmentationRepresentations.Contour,
        }),
    },
  ];
};

export default getPanelModule;
