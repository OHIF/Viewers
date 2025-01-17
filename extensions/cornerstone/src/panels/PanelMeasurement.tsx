import React, { useEffect, useRef } from 'react';
import { CommandsManager, ServicesManager, utils } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';
import { StudySummaryFromMetadata } from '../components/StudySummaryFromMetadata';

const { groupByStudyDeprecated: defaultGroupingFunction } = utils.MeasurementGroupings;

export type withAppAndFilters = withAppTypes & {
  measurementFilter: (item) => boolean;
  groupingFunction?: ({
    servicesManager,
    commandsManager,
  }: {
    servicesManager?: ServicesManager;
    commandsManager?: CommandsManager;
  }) => (groupedMeasurements: Map<string, object[]>, item) => Map<string, object[]>;
  title: string;
};

const { filterAdditionalFindings, filterAny } = utils.MeasurementFilters;

export default function PanelMeasurement({
  servicesManager,
  commandsManager,
  customHeader,
  measurementFilter = filterAny,
  groupingFunction,
  title,
}: withAppAndFilters): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const { measurementService } = servicesManager.services;

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

  const additionalFilter = filterAdditionalFindings(measurementService);

  const effectiveGroupingFunction = (groupingFunction ?? defaultGroupingFunction)({
    servicesManager,
    commandsManager,
  });

  const measurements = displayMeasurements
    .filter(item => !additionalFilter(item) && measurementFilter(item))
    .reduce(effectiveGroupingFunction, new Map<string, object[]>());

  const additionalFindings = displayMeasurements
    .filter(item => additionalFilter(item) && measurementFilter(item))
    .reduce(effectiveGroupingFunction, new Map<string, object[]>());

  const measurementItemKeys = Array.from(measurements).map(([key]) => {
    return key;
  });

  const additionalItemKeys = Array.from(additionalFindings).map(([key]) => {
    return key;
  });

  const items = Array.from(new Set([...measurementItemKeys, ...additionalItemKeys])).map(study => {
    return {
      study,
      measurements: measurements.get(study) ?? [],
      additionalFindings: additionalFindings.get(study) ?? [],
    };
  });

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
        {items.length === 0 ? (
          <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
            No measurements
          </div>
        ) : (
          <></>
        )}
        {items.map(item => {
          return (
            <div key={`${item.study}`}>
              <StudySummaryFromMetadata StudyInstanceUID={item.study} />
              {item.measurements.length === 0 ? (
                <></>
              ) : (
                <MeasurementTable
                  title={title ? title : `Measurements`}
                  data={item.measurements}
                  {...onArgs}
                >
                  <MeasurementTable.Header>
                    {customHeader && (
                      <>
                        {typeof customHeader === 'function'
                          ? customHeader({
                              additionalFindings,
                              measurements,
                              measurementFilter,
                              studyInstanceUID: item.study,
                            })
                          : customHeader}
                      </>
                    )}
                  </MeasurementTable.Header>
                  <MeasurementTable.Body />
                </MeasurementTable>
              )}

              {item.additionalFindings.length === 0 ? (
                <></>
              ) : (
                <MeasurementTable
                  key="additional"
                  data={item.additionalFindings}
                  title={`Additional Findings`}
                  {...onArgs}
                >
                  <MeasurementTable.Body />
                </MeasurementTable>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
