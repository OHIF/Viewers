import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

interface StudyQuickPreviewProps {
  studyInstanceUid: string;
  modalities: string;
  patientName: string;
  studyDate: string;
  onLaunch: () => void;
}

const StudyQuickPreview: React.FC<StudyQuickPreviewProps> = ({
  studyInstanceUid,
  modalities,
  patientName,
  studyDate,
  onLaunch,
}) => {
  return (
    <div className="bg-secondary-dark border-secondary-light flex flex-col gap-4 rounded-lg border p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Quick Preview</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLaunch}
        >
          <Icons.LaunchArrow className="h-5 w-5 text-white" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
        <div>
          <span className="block text-xs text-gray-500">Patient</span>
          {patientName}
        </div>
        <div>
          <span className="block text-xs text-gray-500">Date</span>
          {studyDate}
        </div>
        <div>
          <span className="block text-xs text-gray-500">Modalities</span>
          {modalities}
        </div>
        <div>
          <span className="block text-xs text-gray-500">UID</span>
          <span
            className="block w-32 truncate"
            title={studyInstanceUid}
          >
            {studyInstanceUid}
          </span>
        </div>
      </div>
      {/* Placeholder for thumbnails */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-primary-dark flex h-24 w-24 flex-none items-center justify-center rounded text-gray-600"
          >
            Img {i}
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        onClick={onLaunch}
      >
        Open Study
      </Button>
    </div>
  );
};

export { StudyQuickPreview };
