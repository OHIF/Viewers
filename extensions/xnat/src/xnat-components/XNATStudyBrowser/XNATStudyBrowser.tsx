import React from 'react';
import XNATStudyItem from './XNATStudyItem';
import './XNATStudyBrowser.css';

interface XNATStudyBrowserProps {
  studies: Array<{
    StudyInstanceUID: string;
    StudyDescription?: string;
    thumbnails: Array<any>;
    session?: {
      experimentId: string;
      projectId: string;
      subjectId: string;
    };
  }>;
  onThumbnailClick: (displaySetInstanceUID: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onThumbnailDoubleClick: (displaySetInstanceUID: string) => void;
  supportsDrag?: boolean;
}

export default function XNATStudyBrowser({
  studies,
  onThumbnailClick,
  onThumbnailDoubleClick,
  supportsDrag = false,
}: XNATStudyBrowserProps) {
  
  // Check if we have any studies
  if (!studies || studies.length === 0) {
    return (
      <div className="xnat-study-browser empty-studies">
        <div className="no-studies-message">No studies available</div>
      </div>
    );
  }

  return (
    <div className="xnat-study-browser">
      {studies.map((study) => (
        <XNATStudyItem
          key={study.StudyInstanceUID}
          study={study}
          onThumbnailClick={onThumbnailClick}
          onThumbnailDoubleClick={onThumbnailDoubleClick}
          supportsDrag={supportsDrag}
          isDefaultExpanded={studies.length === 1} // Auto-expand if only one study
        />
      ))}
    </div>
  );
}

