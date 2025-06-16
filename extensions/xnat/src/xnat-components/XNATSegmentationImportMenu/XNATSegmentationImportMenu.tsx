import React, { useState, useEffect } from 'react';
import { XnatSessionRoiCollections } from '../../utils/IO/classes/queryXnatRois';
import { importSegmentation } from '../../utils/importSegmentation';
import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer';
import './XNATSegmentationImportMenu.css';

interface XNATSegmentationImportMenuProps {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  onClose: () => void;
  servicesManager: any;
}

interface SegmentationItem {
  id: string;
  label: string;
  description?: string;
  relativeUri: string;
}

const XNATSegmentationImportMenu: React.FC<XNATSegmentationImportMenuProps> = ({
  studyInstanceUID,
  seriesInstanceUID,
  onClose,
  servicesManager,
}) => {
  const [segmentations, setSegmentations] = useState<SegmentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    loadSegmentations();
  }, [studyInstanceUID]);

  const loadSegmentations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query XNAT for available segmentations
      const collections = await XnatSessionRoiCollections();
      
      // Filter for SEG collections - remove studyInstanceUID filter for now since
      // XNAT experiment ID doesn't match DICOM Study Instance UID
      const segCollections = collections.filter((collection: any) => 
        collection.type === 'SEG'
      );
      
      const segmentationItems: SegmentationItem[] = segCollections.map((collection: any) => ({
        id: collection.id,
        label: collection.label || collection.name || `Segmentation ${collection.id}`,
        description: collection.description,
        relativeUri: collection.relativeUri,
      }));
      
      setSegmentations(segmentationItems);
    } catch (err) {
      console.error('Error loading segmentations:', err);
      setError('Failed to load segmentations from XNAT');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSegmentation = async (segmentation: SegmentationItem) => {
    try {
      setImporting(segmentation.id);
      
      // Download the SEG file from XNAT using authenticated fetchJSON
      const relativeUri = (segmentation as any).relativeUri;
      if (!relativeUri) {
        throw new Error('No download URI available for this segmentation');
      }
      console.log('Downloading segmentation from:', relativeUri);
      
      const fetchPromise = fetchArrayBuffer(relativeUri);
      
      const arrayBuffer = await fetchPromise.promise;
      
      if (!arrayBuffer) {
        throw new Error('Failed to download segmentation file - no data received');
      }
      
      // Import the segmentation using the utility function
      await importSegmentation({
        arrayBuffer,
        studyInstanceUID,
        seriesInstanceUID,
        servicesManager,
      });
      
      // Show success notification
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Import Successful',
        message: `Segmentation "${segmentation.label}" imported successfully`,
        type: 'success',
        duration: 3000,
      });
      
      onClose();
    } catch (err) {
      console.error('Error importing segmentation:', err);
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Import Failed',
        message: `Failed to import segmentation: ${err.message}`,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setImporting(null);
    }
  };

  if (loading) {
    return (
      <div className="xnat-segmentation-import-menu">
        <div className="xnat-segmentation-import-header">
          <h3>Import Segmentation from XNAT</h3>
          <button className="xnat-close-button" onClick={onClose}>×</button>
        </div>
        <div className="xnat-segmentation-import-content">
          <div className="xnat-loading">Loading segmentations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="xnat-segmentation-import-menu">
        <div className="xnat-segmentation-import-header">
          <h3>Import Segmentation from XNAT</h3>
          <button className="xnat-close-button" onClick={onClose}>×</button>
        </div>
        <div className="xnat-segmentation-import-content">
          <div className="xnat-error">{error}</div>
          <button className="xnat-retry-button" onClick={loadSegmentations}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xnat-modal-overlay" onClick={onClose}>
      <div className="xnat-segmentation-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="xnat-segmentation-import-header">
          <h3>Select Segmentation to Import</h3>
          <button className="xnat-close-button" onClick={onClose}>×</button>
        </div>
        <div className="xnat-segmentation-import-content">
          {segmentations.length === 0 ? (
            <div className="xnat-no-segmentations">
              <div className="xnat-empty-icon">📋</div>
              <p>No segmentations available for this study</p>
            </div>
          ) : (
            <div className="xnat-segmentation-selection">
              <p className="xnat-selection-instruction">
                Choose a segmentation to import into the current viewer:
              </p>
              <div className="xnat-segmentation-grid">
                {segmentations.map((segmentation) => (
                  <div 
                    key={segmentation.id} 
                    className={`xnat-segmentation-card ${importing === segmentation.id ? 'importing' : ''}`}
                    onClick={() => !importing && handleImportSegmentation(segmentation)}
                  >
                    <div className="xnat-segmentation-icon">🎯</div>
                    <div className="xnat-segmentation-details">
                      <div className="xnat-segmentation-name">{segmentation.label}</div>
                      {segmentation.description && (
                        <div className="xnat-segmentation-desc">
                          {segmentation.description}
                        </div>
                      )}
                    </div>
                    <div className="xnat-import-status">
                      {importing === segmentation.id ? (
                        <div className="xnat-importing-spinner">⏳</div>
                      ) : (
                        <div className="xnat-import-arrow">→</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="xnat-modal-footer">
          <button className="xnat-cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default XNATSegmentationImportMenu;