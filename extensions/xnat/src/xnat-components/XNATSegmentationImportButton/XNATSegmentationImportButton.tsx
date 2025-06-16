import React, { useState } from 'react';
import { useSystem } from '@ohif/core';
import XNATSegmentationImportMenu from '../XNATSegmentationImportMenu/XNATSegmentationImportMenu';

interface XNATSegmentationImportButtonProps {
  className?: string;
  label?: string;
}

const XNATSegmentationImportButton: React.FC<XNATSegmentationImportButtonProps> = ({
  className = '',
  label = 'Import from XNAT',
}) => {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService, uiModalService } = servicesManager.services;
  const [showImportMenu, setShowImportMenu] = useState(false);

  const handleImportClick = () => {
    // Get current viewport data
    const { activeViewportId, viewports } = viewportGridService.getState();
    
    if (activeViewportId && viewports.has(activeViewportId)) {
      const viewport = viewports.get(activeViewportId);
      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
      
      if (displaySetInstanceUID) {
        const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
        
        if (displaySet) {
          // Show the import menu in a modal
          uiModalService.show({
            content: XNATSegmentationImportMenu,
            contentProps: {
              studyInstanceUID: displaySet.StudyInstanceUID,
              seriesInstanceUID: displaySet.SeriesInstanceUID,
              onClose: () => uiModalService.hide(),
              servicesManager,
            },
            title: 'Import Segmentation from XNAT',
          });
        } else {
          console.warn('No display set found for current viewport');
        }
      } else {
        console.warn('No display set instance UID found in current viewport');
      }
    } else {
      console.warn('No active viewport found');
    }
  };

  return (
    <button
      className={`bg-primary-dark hover:bg-primary-light text-white px-3 py-2 rounded text-sm ${className}`}
      onClick={handleImportClick}
      title={label}
    >
      📥 {label}
    </button>
  );
};

export default XNATSegmentationImportButton; 