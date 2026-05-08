import React, { useState, useEffect, useCallback } from 'react';
import { useSystem, utils } from '@ohif/core';
import { AccordionTrigger, MeasurementTable, ScrollArea, useViewportGrid } from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudySummaryFromMetadata,
  AccordionGroup,
  StudyMeasurementsActions,
  MeasurementsOrAdditionalFindings,
} from '@ohif/extension-cornerstone';
import { DENTAL_TOOL_NAMES } from './PanelDentalMeasurements';

const { filterMeasurementsBySeriesUID, filterAny } = utils.MeasurementFilters;

function PanelTrackedMeasurementsNoDental(props: any) {
  const [viewportGrid] = useViewportGrid();
  const { servicesManager } = useSystem();
  const { measurementService, uiModalService, trackedMeasurementsService } =
    servicesManager.services as any;

  const [trackedSeries, setTrackedSeries] = useState<string[]>(
    () => trackedMeasurementsService?.getTrackedSeries() ?? []
  );

  useEffect(() => {
    if (!trackedMeasurementsService) return;

    const { unsubscribe } = trackedMeasurementsService.subscribe(
      trackedMeasurementsService.EVENTS.TRACKED_SERIES_CHANGED,
      ({ trackedSeries: series }: { trackedSeries: string[] }) => {
        setTrackedSeries(series ?? []);
      }
    );

    return unsubscribe;
  }, [trackedMeasurementsService]);

  const baseFilter = trackedSeries.length
    ? filterMeasurementsBySeriesUID(trackedSeries)
    : filterAny;

  const measurementFilter = useCallback(
    (measurement: any) => !DENTAL_TOOL_NAMES.has(measurement.toolName) && baseFilter?.(measurement),
    [trackedSeries]
  );

  const onDelete = useCallback(() => {
    const hasDirtyMeasurements = measurementService
      .getMeasurements()
      .filter(measurementFilter)
      .some((m: any) => m.isDirty);

    const doDelete = () => {
      measurementService
        .getMeasurements()
        .filter(measurementFilter)
        .forEach((m: any) => measurementService.remove(m.uid));
      trackedMeasurementsService?.reset?.();
    };

    if (hasDirtyMeasurements) {
      uiModalService?.show({
        title: 'Untrack Study',
        content: ({ onClose }: any) => (
          <div className="p-4">
            <p>Are you sure you want to untrack this study and delete all measurements?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="border-input rounded border px-3 py-1">
                Cancel
              </button>
              <button
                onClick={() => {
                  doDelete();
                  onClose();
                }}
                className="bg-primary text-primary-foreground rounded px-3 py-1"
              >
                Confirm
              </button>
            </div>
          </div>
        ),
      });
    } else {
      doDelete();
    }
  }, [measurementService, measurementFilter, trackedMeasurementsService, uiModalService]);

  const EmptyComponent = () => (
    <div data-cy="trackedMeasurements-panel">
      <MeasurementTable title="Measurements" isExpanded={false}>
        <MeasurementTable.Body />
      </MeasurementTable>
    </div>
  );

  const actions = {
    createSR: undefined,
    onDelete,
  };

  const Header = (headerProps: any) => (
    <AccordionTrigger asChild={true} className="px-0">
      <div data-cy="TrackingHeader">
        <StudySummaryFromMetadata {...headerProps} actions={actions} />
      </div>
    </AccordionTrigger>
  );

  return (
    <ScrollArea>
      <div data-cy="trackedMeasurements-panel">
        <PanelMeasurement
          measurementFilter={measurementFilter}
          emptyComponent={EmptyComponent}
          sourceChildren={props.children}
        >
          <StudyMeasurements grouping={props.grouping}>
            <AccordionGroup.Trigger key="trackingMeasurementsHeader" asChild={true}>
              <Header key="trackingHeadChild" />
            </AccordionGroup.Trigger>
            <MeasurementsOrAdditionalFindings
              key="measurementsOrAdditionalFindings"
              customHeader={StudyMeasurementsActions}
              measurementFilter={measurementFilter}
              actions={actions}
            />
          </StudyMeasurements>
        </PanelMeasurement>
      </div>
    </ScrollArea>
  );
}

export default PanelTrackedMeasurementsNoDental;
