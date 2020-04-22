import React from 'react';
import { ViewportActionBar, Notification, Button } from '@ohif/ui';

const Viewport = ({
  viewportIndex,
  onSeriesChange,
  studyData,
  isTracked,
  studyDate,
  modality,
  currentSeries,
  patientInformation,
  activeViewportIndex,
  children,
}) => {
  return (
    <div className="flex flex-col h-full">
      <ViewportActionBar isTracked modality={modality} />

      {/* TODO: NOTIFICATION API DEFINITION - OHIF-112 */}
      <Notification
        text="Track all measurement for this series?"
        type="info"
        actionButtons={
          <div>
            <Button>No</Button>
            <Button className="ml-2">No, do not ask again</Button>
            <Button className="ml-2" color="primary">
              Yes
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default Viewport;
