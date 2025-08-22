import React from 'react';
import { StudyBrowser } from '@ohif/ui-next';

interface XNATStudyBrowserProps {
  studies: Array<{
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
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <div className="text-sm text-muted-foreground">No studies available</div>
      </div>
    );
  }

  // Transform XNAT data to StudyBrowser format
  const transformedData = {
    tabs: [{
      name: 'xnat-studies',
      label: 'XNAT Studies',
      studies: studies.map(study => ({
        studyInstanceUid: study.StudyInstanceUID,
        date: study.session?.experimentId || 'Unknown',
        description: study.StudyDescription || 'No description',
        numInstances: study.thumbnails.reduce((total, thumb) => total + (thumb.numImageFrames || 0), 0),
        modalities: study.thumbnails.map(thumb => thumb.modality).filter(Boolean).join(', '),
        displaySets: study.thumbnails.map(thumb => ({
          displaySetInstanceUID: thumb.displaySetInstanceUID,
          imageSrc: thumb.imageSrc,
          imageAltText: thumb.SeriesDescription,
          seriesDate: '',
          seriesNumber: thumb.SeriesNumber,
          numInstances: thumb.numImageFrames,
          description: thumb.SeriesDescription,
          componentType: 'thumbnail' as const,
          isTracked: false,
          dragData: supportsDrag ? { type: 'displaySet' } : undefined,
        }))
      }))
    }],
    activeTabName: 'xnat-studies',
    expandedStudyInstanceUIDs: studies.map(s => s.StudyInstanceUID),
    activeDisplaySetInstanceUIDs: [],
    showSettings: false,
    servicesManager: null,
  };

  return (
    <div className="h-full">
      <StudyBrowser
        {...transformedData}
        onClickStudy={() => {}} // No-op for now
        onClickTab={() => {}} // No-op for now
        onClickThumbnail={onThumbnailClick}
        onDoubleClickThumbnail={onThumbnailDoubleClick}
        onClickUntrack={() => {}} // No-op for now
      />
    </div>
  );
}

