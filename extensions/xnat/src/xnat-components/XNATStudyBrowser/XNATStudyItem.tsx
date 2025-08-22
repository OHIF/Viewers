import React, { useState } from 'react';
import XNATSeriesList from './XNATSeriesList';

// Simple triangle icons
const MinusIcon = () => (
  <span className="text-primary text-xs font-bold w-4 h-4 text-center leading-4">▼</span>
);

const PlusIcon = () => (
  <span className="text-primary text-xs font-bold w-4 h-4 text-center leading-4">▶</span>
);

interface Thumbnail {
  displaySetInstanceUID: string;
  imageId?: string;
  InstanceNumber?: number | string;
  SeriesDescription?: string;
  SeriesNumber?: number | string;
  numImageFrames?: number;
  stackPercentComplete?: number;
}

interface Study {
  StudyInstanceUID: string;
  StudyDescription?: string;
  thumbnails: Thumbnail[];
  session?: {
    experimentId: string;
    projectId: string;
    subjectId: string;
  };
  [key: string]: any;
}



interface XNATStudyItemProps {
  study: {
    StudyInstanceUID: string;
    StudyDescription?: string;
    thumbnails: Array<any>;
    session?: {
      experimentId: string;
      projectId: string;
      subjectId: string;
    };
  };
  onThumbnailClick: (displaySetInstanceUID: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onThumbnailDoubleClick: (displaySetInstanceUID: string) => void;
  supportsDrag?: boolean;
  isDefaultExpanded?: boolean;
}

/**
 * XNATStudyItem component - Displays a study with expandable series list
 */
function XNATStudyItem({
  study,
  onThumbnailClick,
  onThumbnailDoubleClick,
  supportsDrag = false,
  isDefaultExpanded = true,
}: XNATStudyItemProps) {
  const [expanded, setExpanded] = useState(isDefaultExpanded);
  const { StudyInstanceUID, StudyDescription, thumbnails = [] } = study;
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="flex flex-col mb-3 bg-card rounded overflow-visible">
      <div 
        className="flex items-center p-2 cursor-pointer bg-muted hover:bg-accent/50 transition-colors duration-200 rounded-t"
        onClick={handleExpandClick}
      >
        <div className="mr-2 text-xs w-4 h-4 flex items-center justify-center">
          {expanded ? <MinusIcon /> : <PlusIcon />}
        </div>
        <div className="flex-1 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
          {StudyDescription || 'No description'}
        </div>
        <div className="text-xs text-muted-foreground ml-2">
          {thumbnails.length} series
        </div>
      </div>
      
      {expanded && (
        <div className="overflow-visible">
          <XNATSeriesList
            study={study}
            onThumbnailClick={onThumbnailClick}
            onThumbnailDoubleClick={onThumbnailDoubleClick}
            supportsDrag={supportsDrag}
          />
        </div>
      )}
    </div>
  );
}

export default XNATStudyItem; 