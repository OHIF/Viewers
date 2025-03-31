import React, { useState } from 'react';
import XNATSeriesList from './XNATSeriesList';

// Simple triangle icons
const MinusIcon = () => (
  <span style={{ 
    color: '#5acce6',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    width: '16px',
    height: '16px',
    textAlign: 'center',
    lineHeight: '16px'
  }}>▼</span>
);

const PlusIcon = () => (
  <span style={{ 
    color: '#5acce6',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    width: '16px',
    height: '16px',
    textAlign: 'center',
    lineHeight: '16px'
  }}>▶</span>
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

// Study item styles to ensure proper display
const studyItemStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '10px',
    backgroundColor: 'var(--ui-gray-dark, #2c363f)',
    borderRadius: '5px',
    overflow: 'visible',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    cursor: 'pointer',
    backgroundColor: 'var(--ui-gray, #3a4147)',
    transition: 'background-color 0.2s ease',
  },
  expandIcon: {
    marginRight: '10px',
    fontSize: '12px',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    flex: 1,
    fontWeight: 'bold' as const,
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  seriesCount: {
    fontSize: '12px',
    color: 'var(--ui-gray-lightest, #d3d3d3)',
    marginLeft: '10px',
  },
  content: {
    overflow: 'visible',
  }
};

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
    <div style={studyItemStyles.container} className="xnat-study-item">
      <div 
        style={studyItemStyles.header} 
        className="study-header" 
        onClick={handleExpandClick}
      >
        <div style={studyItemStyles.expandIcon} className="expand-icon">
          {expanded ? '▼' : '►'}
        </div>
        <div style={studyItemStyles.description} className="study-description">
          {StudyDescription || 'No description'}
        </div>
        <div style={studyItemStyles.seriesCount} className="series-count">
          {thumbnails.length} series
        </div>
      </div>
      
      {expanded && (
        <div style={studyItemStyles.content}>
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