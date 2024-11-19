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

  const jumpToImage = (uid: string) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);
    onMeasurementItemClickHandler(uid, true);
  };

  const removeMeasurement = (uid: string) => {
    measurementService.remove(uid);
  };

  const renameMeasurement = (uid: string) => {
    jumpToImage(uid);
    const labelConfig = customizationService.get('measurementLabels');
    const measurement = measurementService.getMeasurement(uid);
    showLabelAnnotationPopup(measurement, uiDialogService, labelConfig).then(val => {
      measurementService.update(
        uid,
        {
          ...val,
        },
        true
      );
    });
  };

  const changeColorMeasurement = (uid: string) => {
    const { color } = measurementService.getMeasurement(uid);
    const rgbaColor = {
      r: color[0],
      g: color[1],
      b: color[2],
      a: color[3] / 255.0,
    };
    colorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      if (actionId === 'cancel') {
        return;
      }

      const color = [newRgbaColor.r, newRgbaColor.g, newRgbaColor.b, newRgbaColor.a * 255.0];
      // segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color);
    });
  };

  const toggleLockMeasurement = (uid: string) => {
    measurementService.toggleLockMeasurement(uid);
  };

  const toggleVisibilityMeasurement = (uid: string) => {
    measurementService.toggleVisibilityMeasurement(uid);
  };

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
