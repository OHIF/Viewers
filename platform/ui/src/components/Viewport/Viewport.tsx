import React from 'react';
import LegacyViewportActionBar from '../LegacyViewportActionBar';
import Notification from '../Notification';

interface StudyData {
  label: string;
  isTracked: boolean;
  isLocked: boolean;
  isRehydratable: boolean;
  studyDate: string;
  currentSeries: number;
  seriesDescription: string;
  modality: string;
  patientInformation: {
    patientName: string;
    patientSex: string;
    patientAge: string;
    MRN: string;
    thickness: string;
    spacing: string;
    scanner: string;
  };
}

interface ViewportProps {
  viewportId: string;
  onArrowsClick: () => void;
  studyData: StudyData;
  children: React.ReactNode;
}

const Viewport: React.FC<ViewportProps> = ({ viewportId, onArrowsClick, studyData, children }) => {
  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-0 left-0 w-full">
        <LegacyViewportActionBar
          onArrowsClick={onArrowsClick}
          studyData={studyData}
        />

        {/* TODO: NOTIFICATION API DEFINITION - OHIF-112 */}
        <Notification
          message="Track all measurement for this series?"
          type="info"
          actions={[
            {
              type: 'cancel',
              text: 'No',
              value: 0,
            },
            {
              type: 'secondary',
              text: 'No, do not ask again',
              value: -1,
            },
            {
              type: 'primary',
              text: 'Yes',
              value: 1,
            },
          ]}
          onSubmit={value => {
            if (typeof window !== 'undefined') {
              window.alert(value);
            }
          }}
        />
      </div>

      {/* STUDY IMAGE */}
      <div
        className="h-full w-full"
        id={viewportId}
      >
        {children}
      </div>
    </div>
  );
};

export default Viewport;
export type { ViewportProps, StudyData };
