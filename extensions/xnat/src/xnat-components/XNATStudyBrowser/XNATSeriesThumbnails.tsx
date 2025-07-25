import React, { useEffect, useState } from 'react';
import XNATThumbnail from './XNATThumbnail';
import XnatSessionRoiCollections from '../../utils/IO/queryXnatRois';
import sessionMap from '../../utils/sessionMap';

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
  [key: string]: any;
}

interface Session {
  data?: {
    experimentId?: string;
    subject?: string;
    modality?: string;
    project?: string;
  };
  projectId?: string;
  subjectId?: string;
  experimentId?: string;
}

interface XNATSeriesThumbnailsProps {
  study: Study;
  supportsDrag?: boolean;
  onThumbnailClick?: (displaySetInstanceUID: string, event: React.MouseEvent) => void;
  onThumbnailDoubleClick?: (displaySetInstanceUID: string) => void;
}

// Add inline styles
const styles = {
  thumbnailsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    padding: '10px'
  }
};

function XNATSeriesThumbnails({
  study,
  onThumbnailClick,
  onThumbnailDoubleClick,
  supportsDrag
}: XNATSeriesThumbnailsProps): JSX.Element {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [hasRois, setHasRois] = useState<boolean>(false);

  // Get thumbnails from study
  useEffect(() => {
    if (study && study.thumbnails) {
      setThumbnails(study.thumbnails);
    }
  }, [study]);

  // Check for ROIs
  useEffect(() => {
    const xnatStudyInstanceUID = study?.StudyInstanceUID;
    
    if (!xnatStudyInstanceUID) {
      return;
    }

    try {
      // Try to get session from sessionMap
      const session = sessionMap.getSession(xnatStudyInstanceUID);
      
      // Check if we have a valid session with experiment ID
      if (session?.data?.experimentId || session?.experimentId) {
        // Prepare session data for ROI query
        const sessionData = {
          projectId: session.data?.project || session.projectId,
          subjectId: session.data?.subject || session.subjectId,
          experimentId: session.data?.experimentId || session.experimentId,
        };
        
        // Query for ROIs if we have minimum required data
        if (sessionData.experimentId) {
          const queryObject = new XnatSessionRoiCollections();
          
          // Safely handle the async query
          const checkForRois = async () => {
            try {
              const roisResult = await queryObject.queryAll(sessionData);
              const hasAnyRois = !!roisResult;
              setHasRois(hasAnyRois);
            } catch (error) {
              console.error('XNATSeriesThumbnails: Error checking for ROIs', error);
              setHasRois(false);
            }
          };

          checkForRois();
        } else {
        }
      } else {
        // Try to see if there's a direct session available in the study object
        if (study.session) {
          
          const sessionData = {
            projectId: study.session.project || study.session.projectId,
            subjectId: study.session.subject || study.session.subjectId,
            experimentId: study.session.experimentId
          };
          
          if (sessionData.experimentId) {
            const queryObject = new XnatSessionRoiCollections();
            
            const checkForRois = async () => {
              try {
                const roisResult = await queryObject.queryAll(sessionData);
                const hasAnyRois = !!roisResult;
                setHasRois(hasAnyRois);
              } catch (error) {
                console.error('XNATSeriesThumbnails: Error checking for ROIs from study session:', error);
                setHasRois(false);
              }
            };

            checkForRois();
          } else {
          }
        } else {
        }
      }
    } catch (error) {
      console.error('XNATSeriesThumbnails: Exception checking for ROIs', error);
    }
  }, [study]);

  const filteredThumbnails = thumbnails.filter(
    thumbnail => thumbnail.SeriesDescription !== 'Segmentation'
  );

  const handleThumbnailClick = (id: string, event: React.MouseEvent) => {
    if (onThumbnailClick) {
      onThumbnailClick(id, event);
    }
  };

  const handleThumbnailDoubleClick = (id: string) => {
    if (onThumbnailDoubleClick) {
      onThumbnailDoubleClick(id);
    }
  };

  return (
    <div style={styles.thumbnailsContainer}>
      {filteredThumbnails.map((thumbnail, i) => {
        return (
          <XNATThumbnail
            key={i}
            id={thumbnail.displaySetInstanceUID}
            onClick={handleThumbnailClick}
            onDoubleClick={handleThumbnailDoubleClick}
            SeriesDescription={thumbnail.SeriesDescription}
            SeriesNumber={thumbnail.SeriesNumber}
            hasRois={hasRois}
            numImageFrames={thumbnail.numImageFrames}
            seriesActive={false}
            imageId={thumbnail.imageId}
          />
        );
      })}
    </div>
  );
}

export { XNATSeriesThumbnails };
export default XNATSeriesThumbnails; 