import React, { useEffect, useRef } from 'react';
import { useViewportGrid } from '@ohif/ui';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../hooks/useMeasurements';
import { showLabelAnnotationPopup, colorPickerDialog } from '@ohif/extension-default';

export default function PanelMeasurementTable({
  servicesManager,
  customHeader,
  measurementFilter,
}: withAppTypes): React.ReactNode {
  const measurementsPanelRef = useRef(null);

  const [viewportGrid] = useViewportGrid();
  const { measurementService, customizationService, uiDialogService } = servicesManager.services;

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

  const onMeasurementItemClickHandler = (uid: string, isActive: boolean) => {
    if (isActive) {
      return;
    }

    const measurements = [...displayMeasurements];
    const measurement = measurements.find(m => m.uid === uid);

    measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
    measurement.isActive = true;
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

  const measurements = displayMeasurements.filter(
    dm => dm.measurementType !== measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );
  const additionalFindings = displayMeasurements.filter(
    dm => dm.measurementType === measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );

  return (
    <>
      <div
        className="invisible-scrollbar overflow-y-auto overflow-x-hidden"
        ref={measurementsPanelRef}
        data-cy={'trackedMeasurements-panel'}
      >
        <MeasurementTable
          title="Measurements"
          data={measurements}
          onClick={jumpToImage}
          onDelete={removeMeasurement}
          onToggleVisibility={toggleVisibilityMeasurement}
          onToggleLocked={toggleLockMeasurement}
          onRename={renameMeasurement}
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
            data={additionalFindings}
            title="Additional Findings"
            onClick={jumpToImage}
            onDelete={removeMeasurement}
            onToggleVisibility={toggleVisibilityMeasurement}
            onToggleLocked={toggleLockMeasurement}
            onRename={renameMeasurement}
            // onColor={changeColorMeasurement}
          >
            <MeasurementTable.Body />
          </MeasurementTable>
        )}
      </div>
    </>
  );
}
