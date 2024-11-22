import React, { useEffect, useRef, useState } from 'react';
import { utils } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';

const { filterAdditionalFinding, filterOr, filterAny } = utils.MeasurementFilters;

export type withAppAndFilters = withAppTypes & {
  measurementFilters: Record<string, (item) => boolean>;
};

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
  customHeader,
  measurementFilters,
}: withAppAndFilters): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const { measurementService, customizationService } = servicesManager.services;

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter: filterAny, // filterOr(measurementFilters);
  });

  useEffect(() => {
    if (displayMeasurements.length > 0) {
      debounce(() => {
        measurementsPanelRef.current.scrollTop = measurementsPanelRef.current.scrollHeight;
      }, 300)();
    }
  }, [displayMeasurements.length]);

  const onMeasurementItemClickHandler = (uid: string, isActive: boolean) => {
    if (isActive) {
      return;
    }

    displayMeasurements.forEach(m => (m.isActive = m.uid === uid));
  };

  const bindCommand = (name: string, options?) => {
    return (uid: string) => {
      commandsManager.runCommand(name, { ...options, uid });
      if (options?.clickUid) {
        onMeasurementItemClickHandler(uid, true);
      }
    };
  };

  const jumpToImage = bindCommand('jumpToMeasurement', { clickUid: true });
  const removeMeasurement = bindCommand('removeMeasurement');
  const renameMeasurement = bindCommand('run', {
    commands: ['jumpToMeasurement', 'renameMeasurement'],
    clickUid: true,
  });
  const toggleLockMeasurement = bindCommand('toggleLockMeasurement');
  const toggleVisibilityMeasurement = bindCommand('toggleVisibilityMeasurement');

  const additionalFilter = filterAdditionalFinding(measurementService);

  const { measurementFilter: trackedFilter, untrackedFilter } = measurementFilters;
  const measurements = displayMeasurements.filter(
    item => !additionalFilter(item) && trackedFilter(item)
  );
  const additionalFindings = displayMeasurements.filter(
    item => additionalFilter(item) && trackedFilter(item)
  );
  const untrackedFindings = displayMeasurements.filter(untrackedFilter.bind(measurementFilters));

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
        {untrackedFindings.length > 0 && (
          <MeasurementTable
            key="untracked"
            data={untrackedFindings}
            title="Untracked Findings"
            {...onArgs}
          >
            <MeasurementTable.Body />
          </MeasurementTable>
        )}
      </div>
    </>
  );
}
