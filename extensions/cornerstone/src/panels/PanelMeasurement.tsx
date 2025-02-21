import React, { useEffect, useRef } from 'react';
import { utils } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';

const { filterAdditionalFindings: filterAdditionalFinding, filterAny } = utils.MeasurementFilters;

export type withAppAndFilters = withAppTypes & {
  measurementFilter: (item) => boolean;
};

export default function PanelMeasurement({
  servicesManager,
  commandsManager,
  customHeader,
  measurementFilter = filterAny,
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

  const additionalFilter = filterAdditionalFinding(measurementService);

  const measurements = displayMeasurements.filter(
    item => !additionalFilter(item) && measurementFilter(item)
  );
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
        data-cy={'trackedMeasurements-panel'}
      >
        <MeasurementTable
          key="tracked"
          title="Measurements"
          data={measurements}
          {...onArgs}
          // onColor={changeColorMeasurement}
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
