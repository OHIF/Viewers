import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

interface RecentStudy {
  studyInstanceUid: string;
  patientName: string;
  studyDate: string;
  modalities: string;
}

interface RecentStudiesProps {
  studies: RecentStudy[];
  onStudyClick: (studyInstanceUid: string) => void;
}

const RecentStudies: React.FC<RecentStudiesProps> = ({ studies, onStudyClick }) => {
  if (!studies || studies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        Recent Studies
      </h3>
      <div className="flex flex-col gap-1">
        {studies.map(study => (
          <div
            key={study.studyInstanceUid}
            className="group flex cursor-pointer items-center justify-between rounded p-2 transition-colors hover:bg-gray-800"
            onClick={() => onStudyClick(study.studyInstanceUid)}
          >
            <div className="flex flex-col overflow-hidden">
              <span className="group-hover:text-primary-light truncate text-sm font-medium text-white transition-colors">
                {study.patientName}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{study.studyDate}</span>
                <span>•</span>
                <span>{study.modalities}</span>
              </div>
            </div>
            <Icons.LaunchArrow className="h-4 w-4 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
};

export { RecentStudies };
