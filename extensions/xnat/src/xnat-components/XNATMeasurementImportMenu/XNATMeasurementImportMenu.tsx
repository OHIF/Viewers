import React, { useState, useEffect } from 'react';
import XnatSessionRoiCollections from '../../utils/IO/classes/queryXnatRois';
import { importMeasurementCollection } from '../../utils/IO/classes/JSONMeasurementImporter';
import fetchJSON from '../../utils/IO/fetchJSON';
import './XNATMeasurementImportMenu.css';

interface XNATMeasurementImportMenuProps {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  onClose: () => void;
  servicesManager: any;
}

interface MeasurementCollectionItem {
  id: string;
  label: string;
  description?: string;
  relativeUri: string;
  seriesInstanceUID: string;
  type: string;
}

const XNATMeasurementImportMenu: React.FC<XNATMeasurementImportMenuProps> = ({
  studyInstanceUID,
  seriesInstanceUID,
  onClose,
  servicesManager,
}) => {
  const [collections, setCollections] = useState<MeasurementCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  const loadMeasurementCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      // XnatSessionRoiCollections is an async function that returns all collections
      const allCollections = await XnatSessionRoiCollections();

      // Filter for measurement collections relevant to the current series
      const measCollections = allCollections.filter(
        (c) => c.type === 'MEAS' && c.seriesInstanceUID === seriesInstanceUID
      );

      setCollections(measCollections);
    } catch (err) {
      console.error('Failed to load measurement collections', err);
      setError('Failed to load measurement collections from XNAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeasurementCollections();
  }, [seriesInstanceUID]);

  const handleImportCollection = async (collection: MeasurementCollectionItem) => {
    try {
      setImporting(collection.id);
      const { uiNotificationService } = servicesManager.services;

      // The relativeUri points directly to the file to be fetched
      const collectionJSON = await fetchJSON(collection.relativeUri);

      // The actual data is in the promise property of the response
      const measurementData = await collectionJSON.promise;

      await importMeasurementCollection({
        collectionJSON: measurementData,
        servicesManager,
      });

      uiNotificationService.show({
        title: 'Import Successful',
        message: `Measurement collection "${collection.label}" imported successfully.`,
        type: 'success',
      });

      onClose();
    } catch (err) {
      console.error('Error importing measurement collection:', err);
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Import Failed',
        message: `Failed to import measurement collection: ${err.message}`,
        type: 'error',
      });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="xnat-modal-overlay" onClick={onClose}>
      <div className="xnat-measurement-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="xnat-measurement-import-header">
          <h3>Select Measurement Collection to Import</h3>
          <button className="xnat-close-button" onClick={onClose}>×</button>
        </div>
        <div className="xnat-measurement-import-content">
          {loading ? (
            <div className="xnat-loading">Loading...</div>
          ) : error ? (
            <>
              <div className="xnat-error">{error}</div>
              <button className="xnat-retry-button" onClick={loadMeasurementCollections}>
                Retry
              </button>
            </>
          ) : collections.length === 0 ? (
            <div className="xnat-no-measurements">
              <div className="xnat-empty-icon">📋</div>
              <p>No measurement collections available for this series</p>
            </div>
          ) : (
            <div className="xnat-measurement-selection">
              <p className="xnat-selection-instruction">
                Choose a measurement collection to import:
              </p>
              <div className="xnat-measurement-grid">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`xnat-measurement-card ${importing === collection.id ? 'importing' : ''}`}
                    onClick={() => !importing && handleImportCollection(collection)}
                  >
                    <div className="xnat-measurement-icon">🎯</div>
                    <div className="xnat-measurement-details">
                      <div className="xnat-measurement-name">{collection.label}</div>
                    </div>
                    <div className="xnat-import-status">
                      {importing === collection.id ? (
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

export default XNATMeasurementImportMenu; 