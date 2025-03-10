import React from 'react';
import { useSystem, utils } from '@ohif/core';
import { MeasurementTable, useViewportGrid } from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudyMeasurementsActions,
  StudySummaryFromMetadata,
} from '@ohif/extension-cornerstone';

import { useTrackedMeasurements } from '../getContextModule';

const { filterAnd, filterPlanarMeasurement, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

function PanelMeasurementTableTracking(props) {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const [viewportGrid] = useViewportGrid();
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const measurementFilter = trackedStudy
    ? filterAnd(filterPlanarMeasurement, filterMeasurementsBySeriesUID(trackedSeries))
    : filterPlanarMeasurement;

  const EmptyComponent = () => (
    <MeasurementTable title="Measurements">
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

  const header = props => (
    <div>
      <StudySummaryFromMetadata {...props} />
      <StudyMeasurementsActions
        {...props}
        actions={actions}
      />
    </div>
  );

  return (
    <PanelMeasurement
      servicesManager={servicesManager}
      extensionManager={extensionManager}
      commandsManager={commandsManager}
      measurementFilter={measurementFilter}
      emptyComponent={EmptyComponent}
    >
      <StudyMeasurements
        grouping={{
          ...props.grouping,
          header,
        }}
      />
    </PanelMeasurement>
  );
}

export default PanelMeasurementTableTracking;
