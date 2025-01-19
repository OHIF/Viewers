import React, { useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';

import { utils } from '@ohif/core';
import { PanelAccordion } from '../components/CollapsibleStudySummaryFromMetadata';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';
import NodeComponent from './NodeComponent';
import { MeasurementTable } from '@ohif/ui-next';

const { groupByStudy } = utils.MeasurementGroupings;
const { filterAdditionalFindings, filterAny } = utils.MeasurementFilters;

export type withAppAndFilters = withAppTypes & {
  measurementFilter?: (item) => boolean;
};

export default function PanelMeasurement({
  servicesManager,
  commandsManager,
  measurementFilter = filterAny,
}: withAppAndFilters): React.ReactNode {
  const { measurementService } = servicesManager.services;

  const measurementsPanelRef = useRef(null);
  const additionalFilter = filterAdditionalFindings(measurementService);

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter,
  });

  useEffect(() => {
    if (displayMeasurements.length > 0) {
      debounce(() => {
        measurementsPanelRef.current.scrollTop = measurementsPanelRef.current.scrollHeight;
      }, 300)();
    }
  }, [displayMeasurements.length]);

  const bindCommand = (name: string | string[], options?) => {
    return (uid: string) => {
      commandsManager.run(name, { ...options, uid });
    };
  };

  const jumpToImage = bindCommand('jumpToMeasurement', { displayMeasurements });
  const removeMeasurement = bindCommand('removeMeasurement');
  const renameMeasurement = bindCommand(['jumpToMeasurement', 'renameMeasurement'], {
    displayMeasurements,
  });
  const toggleLockMeasurement = bindCommand('toggleLockMeasurement');
  const toggleVisibilityMeasurement = bindCommand('toggleVisibilityMeasurement');

  const onArgs = {
    onClick: jumpToImage,
    onDelete: removeMeasurement,
    onToggleVisibility: toggleVisibilityMeasurement,
    onToggleLocked: toggleLockMeasurement,
    onRename: renameMeasurement,
  };

  return (
    <div
      className="invisible-scrollbar w-max overflow-y-auto overflow-x-hidden"
      ref={measurementsPanelRef}
      data-cy={'measurements-panel'}
    >
      <NodeComponent
        servicesManager={servicesManager}
        items={displayMeasurements}
        nodeSchema={{
          id: 'root',
          groupingFunction: groupByStudy,
          shouldShowFallback: ({ items }) => items.length === 0,
          fallback: (
            <div
              className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base"
              key="fallback"
            >
              No measurements node component
            </div>
          ),
          content:
            ({ items }) =>
            ({ children }) => (
              <PanelAccordion
                header={
                  <StudySummaryFromMetadata StudyInstanceUID={items?.[0]?.referenceStudyUID} />
                }
              >
                {children}
              </PanelAccordion>
            ),
        }}
      >
        <NodeComponent
          servicesManager={servicesManager}
          nodeSchema={{
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
          }}
        />
        <NodeComponent
          servicesManager={servicesManager}
          nodeSchema={{
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
          }}
        />
      </NodeComponent>
    </div>
  );
}
