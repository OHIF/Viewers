import React from 'react';

import { utils } from '@ohif/core';
import { MeasurementTable, Toolbox } from '@ohif/ui-next';

import PanelSegmentation from './panels/PanelSegmentation';
import ActiveViewportWindowLevel from './components/ActiveViewportWindowLevel';
import PanelMeasurement from './panels/PanelMeasurementRecursive';
import { PanelAccordion } from './components/CollapsibleStudySummaryFromMetadata';
import { StudySummaryFromMetadata } from './components/StudySummaryFromMetadata';

const { groupByStudy } = utils.MeasurementGroupings;
const { filterAdditionalFindings } = utils.MeasurementFilters;

const getPanelModule = ({ commandsManager, servicesManager, extensionManager }: withAppTypes) => {
  const { measurementService } = servicesManager.services;
  const additionalFilter = filterAdditionalFindings(measurementService);

  const getNodeSchema = ({ onArgs }) => ({
    id: 'root',
    groupingFunction: groupByStudy,
    shouldShowFallback: ({ items }) => items.length === 0,
    fallback: (
      <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
        No measurements recursive
      </div>
    ),
    content: ({ items }) => {
      return ({ children }) => (
        <PanelAccordion
          header={<StudySummaryFromMetadata StudyInstanceUID={items?.[0]?.referenceStudyUID} />}
        >
          {children}
        </PanelAccordion>
      );
    },
    nodes: [
      {
        id: 'measurements',
        filterFunction: item => !additionalFilter(item),
        shouldShowFallback: ({ filteredItems }) => filteredItems.length === 0,
        content:
          ({ filteredItems }) =>
          () => (
            <MeasurementTable
              title="Measurements"
              data={filteredItems}
              {...onArgs}
            >
              <MeasurementTable.Body />
            </MeasurementTable>
          ),
      },
      {
        id: 'additionalFindings',
        filterFunction: item => additionalFilter(item),
        shouldShowFallback: ({ filteredItems }) => filteredItems.length === 0,
        fallback: <></>,
        content:
          ({ filteredItems }) =>
          () => (
            <MeasurementTable
              key="additional"
              data={filteredItems}
              title="Additional Findings"
              {...onArgs}
            >
              <MeasurementTable.Body />
            </MeasurementTable>
          ),
      },
    ],
  });
  const wrappedPanelSegmentation = ({ configuration }) => {
    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
        }}
      />
    );
  };

  const wrappedPanelSegmentationNoHeader = ({ configuration }) => {
    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = ({ configuration }) => {
    return (
      <>
        <Toolbox
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          buttonSectionId="segmentationToolbox"
          title="Segmentation Tools"
          configuration={{
            ...configuration,
          }}
        />
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

  const wrappedPanelMeasurement = ({ configuration }) => {
    return (
      <PanelMeasurement
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        getNodeSchema={getNodeSchema}
        configuration={{
          ...configuration,
        }}
      />
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
      component: wrappedPanelMeasurement,
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
      name: 'panelSegmentationWithTools',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationWithTools,
    },
  ];
};

export default getPanelModule;
