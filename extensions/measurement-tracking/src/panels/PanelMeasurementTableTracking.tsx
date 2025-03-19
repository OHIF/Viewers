import React from 'react';
import { utils } from '@ohif/core';
import { MeasurementTable, useViewportGrid } from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudyMeasurementsActions,
  StudySummaryFromMetadata,
  AccordionGroup,
  MeasurementsOrAdditionalFindings,
} from '@ohif/extension-cornerstone';

import { useTrackedMeasurements } from '../getContextModule';

const { filterAnd, filterPlanarMeasurement, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

function PanelMeasurementTableTracking(props) {
  const [viewportGrid] = useViewportGrid();
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const measurementFilter = trackedStudy
    ? filterAnd(filterPlanarMeasurement, filterMeasurementsBySeriesUID(trackedSeries))
    : filterPlanarMeasurement;

  const EmptyComponent = () => (
    <MeasurementTable
      title="Measurements"
      isExpanded={false}
    >
      <MeasurementTable.Body />
    </MeasurementTable>
  );

  const actions = {
    createSR: ({ StudyInstanceUID }) => {
      sendTrackedMeasurementsEvent('SAVE_REPORT', {
        viewportId: viewportGrid.activeViewportId,
        isBackupSave: true,
        StudyInstanceUID,
        measurementFilter,
      });
    },
  };

  const Header = props => (
    <div
      data-cy="TrackingHeader"
      key="TrackingHeader"
    >
      <StudySummaryFromMetadata {...props} />
    </div>
  );

  return (
    <PanelMeasurement
      measurementFilter={measurementFilter}
      emptyComponent={EmptyComponent}
      sourceChildren={props.children}
    >
      <StudyMeasurements grouping={props.grouping}>
        <AccordionGroup.Trigger key="trackingMeasurementsHeader">
          <Header key="trackingHeadChild" />
        </AccordionGroup.Trigger>
        <MeasurementsOrAdditionalFindings
          key="measurementsOrAdditionalFindings"
          activeStudyUID={trackedStudy}
          customHeader={StudyMeasurementsActions}
          measurementFilter={measurementFilter}
          actions={actions}
        />
      </StudyMeasurements>
    </PanelMeasurement>
  );
}

export default PanelMeasurementTableTracking;
