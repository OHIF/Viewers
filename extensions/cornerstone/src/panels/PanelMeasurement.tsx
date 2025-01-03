import React, { useEffect, useRef } from 'react';
import { utils } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';

const { filterAdditionalFinding, filterAny } = utils.MeasurementFilters;

export type withAppAndFilters = withAppTypes & {
  measurementFilters: Record<string, (item) => boolean>;
  groupingFunction: (groupedMeasurements: Map<string, object[]>, item) => Map<string, object[]>;
  title: string;
};

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
  customHeader,
  measurementFilters = { measurementFilter: filterAny },
  groupingFunction,
  title,
}: withAppAndFilters): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const { measurementService, displaySetService } = servicesManager.services;

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter: measurementFilters.measurementFilter.bind(measurementFilters),
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

  const additionalFilter = filterAdditionalFinding(measurementService);

  const { measurementFilter } = measurementFilters;
  const defaultGroupingFunction = (groupedMeasurements, item) => {
    const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
    const key = displaySet.instances[0].StudyDescription;

    if (!groupedMeasurements.has(key)) {
      groupedMeasurements.set(key, [item]);
      return groupedMeasurements;
    }

    const oldValues = groupedMeasurements.get(key);
    oldValues.push(item);
    return groupedMeasurements;
  };

  const effectiveGroupingFunction = groupingFunction ?? defaultGroupingFunction;

  const measurements = displayMeasurements
    .filter(item => !additionalFilter(item) && measurementFilter(item))
    .reduce(effectiveGroupingFunction, new Map<string, object[]>());

  const additionalFindings = displayMeasurements.filter(
    item => additionalFilter(item) && measurementFilter(item)
  );

  const onArgs = {
    onClick: jumpToImage,
    onDelete: removeMeasurement,
    onToggleVisibility: toggleVisibilityMeasurement,
    onToggleLocked: toggleLockMeasurement,
    onRename: renameMeasurement,
  };

  return (
    <>
      <div
        className="invisible-scrollbar overflow-y-auto overflow-x-hidden"
        ref={measurementsPanelRef}
        data-cy={'measurements-panel'}
      >
        {Array.from(measurements).length === 0 && additionalFindings.length === 0 ? (
          <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
            No measurements
          </div>
        ) : (
          <></>
        )}
        {Array.from(measurements).map(([key, value]) => {
          return (
            <MeasurementTable
              key={`${key}`}
              title={title ? title : `Measurements for ${key}`}
              data={value}
              {...onArgs}
            >
              <MeasurementTable.Header>
                {customHeader && (
                  <>
                    {typeof customHeader === 'function'
                      ? customHeader({
                          additionalFindings,
                          measurements,
                        })
                      : customHeader}
                  </>
                )}
              </MeasurementTable.Header>
              <MeasurementTable.Body />
            </MeasurementTable>
          );
        })}
        {additionalFindings.length > 0 && (
          <MeasurementTable
            key="additional"
            data={additionalFindings}
            title="Additional Findings"
            {...onArgs}
          >
            <MeasurementTable.Body />
          </MeasurementTable>
        )}
      </div>
    </>
  );
}
