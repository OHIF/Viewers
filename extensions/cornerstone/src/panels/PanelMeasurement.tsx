import React, { useEffect, useRef, useState } from 'react';
import { utils } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';
import { showLabelAnnotationPopup, colorPickerDialog } from '@ohif/extension-default';

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

  const [viewportGrid] = useViewportGrid();
  const { measurementService, customizationService, uiDialogService } = servicesManager.services;
  const [measurements, setMeasurements] = useState([]);
  const [additionalFindings, setAdditionalFindings] = useState([]);
  const [untrackedFindings, setUntrackedFindings] = useState([]);

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

  const bindCommand = (name: string, callJump = false) => {
    return (uid: string) => {
      if (!uid) {
        debugger;
      }
      if (callJump) {
        commandsManager.runCommand('jumpToMeasurement');
      }
      commandsManager.runCommand(name, { uid });
      if (callJump === null) {
        onMeasurementItemClickHandler(uid, true);
      }
    };
  };

  const jumpToImage = bindCommand('jumpToMeasurement', null);
  const removeMeasurement = bindCommand('removeMeasurement');
  const renameMeasurement = bindCommand('renameMeasurement', true);
  const toggleLockMeasurement = bindCommand('toggleLockMeasurement');
  const toggleVisibilityMeasurement = bindCommand('toggleVisibilityMeasurement');

  const additionalFilter = filterAdditionalFinding(measurementService);

  useEffect(() => {
    const { measurementFilter: trackedFilter, untrackedFilter } = measurementFilters;
    setMeasurements(
      displayMeasurements.filter(item => !additionalFilter(item) && trackedFilter(item))
    );
    setAdditionalFindings(
      displayMeasurements.filter(item => additionalFilter(item) && trackedFilter(item))
    );
    setUntrackedFindings(displayMeasurements.filter(untrackedFilter.bind(measurementFilters)));
  }, [measurementFilters, displayMeasurements]);

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
            <MeasurementTable.Header>
              <>
                <div>Hello World</div>
              </>
            </MeasurementTable.Header>
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
            <MeasurementTable.Header>
              <>
                <span>Untracked</span>
              </>
            </MeasurementTable.Header>
            <MeasurementTable.Body />
          </MeasurementTable>
        )}
      </div>
    </>
  );
}
