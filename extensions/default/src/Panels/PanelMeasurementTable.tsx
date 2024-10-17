import React, { useEffect, useRef } from 'react';
import { useViewportGrid } from '@ohif/ui';
import { MeasurementTable } from '@ohif/ui-next';
import debounce from 'lodash.debounce';
import { useMeasurements } from '../utils/measurementUtils';
import { showLabelAnnotationPopup } from '../utils/callInputDialog';

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
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.uid === uid);

      measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
      measurement.isActive = true;
    }
  };

  const jumpToImage = (uid: string, isActive: boolean) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);
    onMeasurementItemClickHandler(uid, isActive);
  };

  const onMeasurementItemEditHandler = (uid: string, isActive: boolean) => {
    jumpToImage(uid, isActive);
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

  const displayMeasurementsWithoutFindings = displayMeasurements.filter(
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
          data={displayMeasurementsWithoutFindings}
          title="Measurements"
        >
          <MeasurementTable.Header>
            {customHeader && (
              <>
                {typeof customHeader === 'function'
                  ? customHeader({
                      additionalFindings,
                      displayMeasurementsWithoutFindings,
                    })
                  : customHeader}
              </>
            )}
          </MeasurementTable.Header>
          <MeasurementTable.Body
            onClick={jumpToImage}
            onDelete={onMeasurementItemEditHandler}
          />
        </MeasurementTable>
        {additionalFindings.length > 0 && (
          <MeasurementTable
            data={additionalFindings}
            title="Additional Findings"
          >
            <MeasurementTable.Body
              onClick={jumpToImage}
              onDelete={onMeasurementItemEditHandler}
            />
          </MeasurementTable>
        )}
      </div>
    </>
  );
}
