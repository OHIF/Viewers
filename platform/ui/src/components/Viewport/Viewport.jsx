import React from 'react';
import PropTypes from 'prop-types';
import { ViewportActionBar, Notification, Button } from '@ohif/ui';

const Viewport = ({
  viewportIndex,
  onSeriesChange,
  hasNotification,
  studyData,
  children,
}) => {
  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full">
        <ViewportActionBar
          onSeriesChange={onSeriesChange}
          studyData={studyData}
        />

        {hasNotification && (
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
        )}
      </div>

      {/* STUDY IMAGE */}
      <div className="w-full h-full" id={`viewport-${viewportIndex}`}>
        {children}
      </div>
    </div>
  );
};

Viewport.propTypes = {
  viewportIndex: PropTypes.number.isRequired,
  onSeriesChange: PropTypes.func.isRequired,
  studyData: PropTypes.shape({
    label: PropTypes.string.isRequired,
    isTracked: PropTypes.bool.isRequired,
    isLocked: PropTypes.bool.isRequired,
    studyDate: PropTypes.string.isRequired,
    currentSeries: PropTypes.number.isRequired,
    seriesDescription: PropTypes.string.isRequired,
    modality: PropTypes.string.isRequired,
    patientInformation: PropTypes.shape({
      patientName: PropTypes.string.isRequired,
      patientSex: PropTypes.string.isRequired,
      patientAge: PropTypes.string.isRequired,
      MRN: PropTypes.string.isRequired,
      thickness: PropTypes.string.isRequired,
      spacing: PropTypes.string.isRequired,
      scanner: PropTypes.string.isRequired,
    }),
  }).isRequired,
  children: PropTypes.node.isRequired,
};

export default Viewport;
