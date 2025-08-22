import React, { useEffect, useState } from 'react';
import XNATThumbnail from './XNATThumbnail';
import sessionMap from '../../utils/sessionMap';

interface XNATSeriesListProps {
  study: {
    StudyInstanceUID: string;
    StudyDescription?: string;
    thumbnails: Array<{
      displaySetInstanceUID: string;
      SeriesDescription: string;
      SeriesNumber: string | number;
      modality: string;
      numImageFrames: number;
      imageId?: string;
      imageSrc?: string;
    }>;
    session?: {
      experimentId: string;
      projectId: string;
      subjectId: string;
    };
  };
  onThumbnailClick: (displaySetInstanceUID: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onThumbnailDoubleClick: (displaySetInstanceUID: string) => void;
  supportsDrag?: boolean;
}



function XNATSeriesList({
  study,
  onThumbnailClick,
  onThumbnailDoubleClick,
  supportsDrag = false,
}: XNATSeriesListProps) {
  const [hasRois, setHasRois] = useState<Record<string, boolean>>({});
  const [activeDisplaySetInstanceUID, setActiveDisplaySetInstanceUID] = useState<string | null>(null);
  
  // Get session information for ROI checking
  useEffect(() => {
    if (!study || !study.StudyInstanceUID) {
      return;
    }
    
    const checkForRois = async () => {
      // Get session from study object directly if available
      let session = study.session;
      
      // Only try to get from sessionMap if study.session is not available and sessionMap.get exists
      if (!session && study.StudyInstanceUID && typeof sessionMap.get === 'function') {
        try {
          session = sessionMap.get(study.StudyInstanceUID);
        } catch (error) {
          console.warn('XNAT: Error accessing sessionMap:', error);
        }
      }
      
      if (!session || !session.experimentId) {
        console.log('XNAT: No session or experiment ID found for ROI checking');
        return;
      }
      
      
      // Here you would typically query XNAT for ROIs associated with this session
      // For now, we'll just log that we're checking
      
      try {
        // This is a placeholder for the XNAT API call to check for ROIs
        // In a real implementation, you would make an API call to XNAT here
        
        // Example of how you might set hasRois for display sets
        const roisByDisplaySet: Record<string, boolean> = {};
        study.thumbnails.forEach(thumbnail => {
          // For now, this is just a placeholder that doesn't actually check for ROIs
          roisByDisplaySet[thumbnail.displaySetInstanceUID] = false;
        });
        
        setHasRois(roisByDisplaySet);
      } catch (error) {
        console.error('XNAT: Error checking for ROIs:', error);
      }
    };
    
    checkForRois();
  }, [study]);
  
  const handleThumbnailClick = (displaySetInstanceUID: string, event: React.MouseEvent<HTMLDivElement>) => {
    setActiveDisplaySetInstanceUID(displaySetInstanceUID);
    if (onThumbnailClick) {
      onThumbnailClick(displaySetInstanceUID, event);
    }
  };
  
  // Filter and sort thumbnails
  const sortedThumbnails = React.useMemo(() => {
    if (!study?.thumbnails) return [];
    
    return [...study.thumbnails]
      .filter(thumbnail => thumbnail.SeriesDescription !== 'Segmentation')
      .sort((a, b) => {
        // Convert to numbers for numerical comparison if possible
        const aNum = Number(a.SeriesNumber);
        const bNum = Number(b.SeriesNumber);
        
        // If both are valid numbers, compare numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Otherwise fall back to string comparison
        const aStr = String(a.SeriesNumber || '');
        const bStr = String(b.SeriesNumber || '');
        return aStr.localeCompare(bStr);
      });
  }, [study?.thumbnails]);
  
  return (
    <div className="flex flex-wrap p-2 gap-2 overflow-visible max-h-full">
      {sortedThumbnails.map((thumbnail) => {
        const { 
          displaySetInstanceUID, 
          SeriesDescription, 
          SeriesNumber, 
          modality, 
          numImageFrames, 
          imageSrc
        } = thumbnail;
        
        const hasRoi = hasRois[displaySetInstanceUID] || false;
        const isActive = displaySetInstanceUID === activeDisplaySetInstanceUID;
        
        return (
          <XNATThumbnail
            key={displaySetInstanceUID}
            id={displaySetInstanceUID}
            SeriesDescription={SeriesDescription}
            SeriesNumber={SeriesNumber}
            numImageFrames={numImageFrames}
            active={isActive}
            imageSrc={imageSrc}
            onClick={(event) => handleThumbnailClick(displaySetInstanceUID, event)}
            onDoubleClick={() => onThumbnailDoubleClick(displaySetInstanceUID)}
          />
        );
      })}
    </div>
  );
}

export default XNATSeriesList; 