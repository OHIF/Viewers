import React, { useState } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import importMaskRoiCollection from '../../utils/IO/importMaskRoiCollection';
import importContourRoiCollections from '../../utils/IO/importContourRoiCollections';

import './RoiImportModal.styl';

const modules = cornerstoneTools.store.modules;

/**
 * getVolumeManagementLabels - Construct a list of roiCollections
 *                               already imported.
 *
 * @returns {string[]} An array of the labels of roiCollections already imported.
 */
const getVolumeImportedContourCollectionLabels = () => {
  const freehand3DStore = modules.freehand3D;
  const structureSetUids = [];

  const seriesCollection = freehand3DStore.state.seriesCollection;

  seriesCollection.forEach(series => {
    const structureSetCollection = series.structureSetCollection;

    for (let i = 0; i < structureSetCollection.length; i++) {
      const label = structureSetCollection[i].uid;

      if (label !== 'DEFAULT') {
        structureSetUids.push(label);
      }
    }
  });

  return structureSetUids;
};

const ImportCollectionContainer = props => {
  const { collections, type, selectedRois, setSelectedRois } = props;
  return (
    <div className="importCollectionContainer">
      <table className="collectionTable">
        <thead>
          <tr>
            <th width="5%" className="centered-cell" />
            <th width="55%">Name</th>
            <th width="40%">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection, index) => (
            <tr key={index}>
              <td className="centered-cell">
                <input
                  className="checkboxInCell"
                  type={type === 'mask' ? 'radio' : 'checkbox'}
                  onChange={evt => {
                    if (type === 'mask') {
                      setSelectedRois([index]);
                    } else {
                      let roiList = [];
                      if (evt.target.checked) {
                        roiList = [...selectedRois, index];
                      } else {
                        roiList = selectedRois.filter(r => r !== index);
                      }
                      setSelectedRois(roiList);
                    }
                  }}
                  checked={selectedRois.includes(index)}
                  value={index}
                />
              </td>
              <td className="left-aligned-cell">{collection.name}</td>
              <td className="left-aligned-cell">{`${collection.date} ${collection.time}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginBottom: 20 }} />
    </div>
  );
};

const RoiImportModal = ({ collections, type, seriesInfo, onClose }) => {
  const [selectedRois, setSelectedRois] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progressText, setProgressText] = useState(type =>
    type === 'mask' ? '' : []
  );
  const [importProgress, setImportProgress] = useState(0);

  let content = null;
  if (importing && type === 'mask') {
    content = (
      <div className="importProgress">
        <h4>{progressText}</h4>
        <h4>{`Loading Data: ${importProgress} %`}</h4>
      </div>
    );
  } else if (importing && type === 'contour') {
    content = (
      <div className="importProgress">
        {progressText[0] && <h4>{progressText[0]}</h4>}
        {progressText[1] && <h4>{progressText[1]}</h4>}
        <h4>{importProgress}</h4>
      </div>
    );
  } else {
    content = (
      <ImportCollectionContainer
        collections={collections}
        type={type}
        selectedRois={selectedRois}
        setSelectedRois={setSelectedRois}
      />
    );
  }

  return (
    <div className="importModalContainer">
      <div className="seriesTitle">
        {`Series ${seriesInfo.SeriesNumber}: ${seriesInfo.SeriesDescription}`}
      </div>
      {content}
      <div className="footer">
        {type === 'mask' && (
          <div style={{ marginRight: 'auto', width: 230 }}>
            <p className="warningMessage" style={{ margin: 0 }}>
              <Icon name="exclamation-triangle" /> Importing another mask-collection will overwrite existing data.
            </p>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={onClose}
            data-cy="cancel-btn"
            className="btn btn-default"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            data-cy="ok-btn"
            onClick={() => {
              if (type === 'mask') {
                setImporting(true);
                importMaskRoiCollection(
                  collections[selectedRois[0]],
                  {
                    updateImportingText: setProgressText,
                    onImportComplete: onClose,
                    updateProgress: setImportProgress,
                  },
                  true
                );
              } else if (type === 'contour') {
                const collectionsToParse = collections.filter((collection, index) =>
                  selectedRois.includes(index)
                );
                setImporting(true);
                importContourRoiCollections(
                  collectionsToParse,
                  {
                    updateImportingText: setProgressText,
                    onImportComplete: onClose,
                    updateProgress: setImportProgress,
                  },
                  true
                );
              }
            }}
            disabled={importing || selectedRois.length < 1}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

RoiImportModal.propTypes = {
  collections: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
  seriesInfo: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RoiImportModal;
export { getVolumeImportedContourCollectionLabels };
