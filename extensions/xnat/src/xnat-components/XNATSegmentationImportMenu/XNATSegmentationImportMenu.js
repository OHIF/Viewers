import React from 'react';
import MaskImporter from '../../utils/IO/classes/MaskImporter';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer.js';
import cornerstoneTools from 'cornerstone-tools';
import sessionMap from '../../utils/sessionMap';
import getReferencedScan from '../../utils/getReferencedScan';
import { Icon } from '@ohif/ui';
import { Loader } from '../../elements';
import importMaskRoiCollection from '../../utils/IO/importMaskRoiCollection';

import '../XNATRoiPanel.styl';

const segmentationModule = cornerstoneTools.getModule('segmentation');

/*const overwriteConfirmationContent = {
  title: `Warning`,
  body: `
    Loading in another Segmentation will overwrite existing segmentation data. Are you sure
    you want to do this?
  `,
};*/

export default class XNATSegmentationImportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this._sessions = sessionMap.getSession();
    this._subjectId = sessionMap.getSubject();
    this._projectId = sessionMap.getProject();

    const sessionSelected = sessionMap.getScan(
      props.viewportData.SeriesInstanceUID,
      'experimentId'
    );
    const sessionRoiCollections = {};
    for (let i = 0; i < this._sessions.length; i++) {
      const experimentId = this._sessions[i].experimentId;
      sessionRoiCollections[experimentId] = {
        experimentLabel: this._sessions[i].experimentLabel,
        importList: [],
        scanSelected: 'All',
        segmentationSelected: '',
      };
    }

    this.state = {
      sessionRoiCollections,
      sessionSelected,
      importListReady: false,
      importing: false,
      progressText: '',
      importProgress: 0,
    };

    this._cancelablePromises = [];
    // TODO -> Re add NIFTI support. This should really be done in a complete way with cornerstoneNiftiImageLoader
    this._validTypes = ['SEG'];
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );
    this.onSelectedScanChange = this.onSelectedScanChange.bind(this);
    this.onChangeRadio = this.onChangeRadio.bind(this);

    this._hasExistingMaskData = this._hasExistingMaskData.bind(this);
    this._updateImportingText = this._updateImportingText.bind(this);

    this.updateProgress = this.updateProgress.bind(this);
    this.onSessionSelectedChange = this.onSessionSelectedChange.bind(this);
  }

  onSessionSelectedChange(evt) {
    this.setState({ sessionSelected: evt.target.value });
  }

  updateProgress(percent) {
    this.setState({ importProgress: percent });
  }

  /**
   * onSelectedScanChange - Update the scanSelected state.
   *
   * @param  {Object} evt  The event.
   * @returns {null}
   */
  onSelectedScanChange(evt) {
    const { sessionRoiCollections, sessionSelected } = this.state;
    const currentCollection = sessionRoiCollections[sessionSelected];
    currentCollection.scanSelected = evt.target.value;

    this.setState({ sessionRoiCollections });
  }

  /**
   * onCloseButtonClick - Cancel the import and switch back to the
   * SegmentationMenu view.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onImportCancel();
  }

  /**
   * onChangeRadio - Update the segmentationSelected index on radio input.
   *
   * @param  {Object} evt   The event.
   * @param  {number} index The index of the radio button.
   * @returns {null}
   */
  onChangeRadio(evt, id) {
    const { sessionRoiCollections, sessionSelected } = this.state;
    const currentCollection = sessionRoiCollections[sessionSelected];

    currentCollection.segmentationSelected = id;

    this.setState({ sessionRoiCollections });
  }

  /**
   * async onImportButtonClick - Import the mask after a possible overwrite confirmation.
   *
   * @returns {null}
   */
  async onImportButtonClick() {
    const { sessionRoiCollections, sessionSelected } = this.state;

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;
    const scanSelected = currentCollection.scanSelected;
    const segmentationSelected = currentCollection.segmentationSelected;

    const segmentationIndex = importList.findIndex(
      item =>
        item.id === segmentationSelected &&
        (item.referencedSeriesNumber == scanSelected || scanSelected === 'All')
    );

    if (segmentationIndex < 0) {
      return;
    }

    const segmentation = importList[segmentationIndex];

    /*const firstImageId = getFirstImageIdFromSeriesInstanceUid(
      segmentation.referencedSeriesInstanceUid
    );

    if (this._hasExistingMaskData(firstImageId)) {
      console.log('TODO: Currently overwrite existing data.');
      // confirmed = await awaitConfirmationDialog(overwriteConfirmationContent);

      // if (!confirmed) {
      //   return;
      // }
    }*/

    this._updateImportingText('');
    this.setState({ importing: true });

    importMaskRoiCollection(segmentation, {
      updateImportingText: this._updateImportingText,
      onImportComplete: this.props.onImportComplete,
      updateProgress: this.updateProgress,
    });
  }

  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @returns {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData(firstImageId) {
    if (segmentationModule.getters.importMetadata(firstImageId)) {
      return true;
    }

    const brushStackState = segmentationModule.state.series[firstImageId];

    if (!brushStackState) {
      return false;
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return false;
    }

    return labelmap3D.metadata.some(data => data !== undefined);
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  /**
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    const { viewportData } = this.props;
    const { sessionRoiCollections, sessionSelected } = this.state;

    const activeSeriesInstanceUid = viewportData.SeriesInstanceUID;
    const activeSessionRoiCollection = sessionRoiCollections[sessionSelected];

    const promises = [];

    for (let i = 0; i < this._sessions.length; i++) {
      const experimentId = this._sessions[i].experimentId;

      const cancelablePromise = fetchJSON(
        `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors?format=json`
      );
      promises.push(cancelablePromise.promise);
      this._cancelablePromises.push(cancelablePromise);
    }

    Promise.all(promises).then(sessionAssessorLists => {
      const roiCollectionPromises = [];

      for (let i = 0; i < sessionAssessorLists.length; i++) {
        const sessionAssessorList = sessionAssessorLists[i];

        const assessors = sessionAssessorList.ResultSet.Result;

        if (
          !assessors.some(
            assessor => assessor.xsiType === 'icr:roiCollectionData'
          )
        ) {
          continue;
        }

        const experimentId = assessors[0].session_ID;

        for (let i = 0; i < assessors.length; i++) {
          if (assessors[i].xsiType === 'icr:roiCollectionData') {
            const cancelablePromise = fetchJSON(
              `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors/${assessors[i].ID}?format=json`
            );

            this._cancelablePromises.push(cancelablePromise);

            roiCollectionPromises.push(cancelablePromise.promise);
          }
        }
      }

      if (!roiCollectionPromises.length) {
        this.setState({ importListReady: true });

        return;
      }

      Promise.all(roiCollectionPromises).then(promisesJSON => {
        promisesJSON.forEach(roiCollectionInfo => {
          if (!roiCollectionInfo) {
            return;
          }

          const data_fields = roiCollectionInfo.items[0].data_fields;

          const referencedScan = getReferencedScan(roiCollectionInfo);

          if (
            referencedScan &&
            this._collectionEligibleForImport(roiCollectionInfo)
          ) {
            const sessionRoiCollection =
              sessionRoiCollections[data_fields.imageSession_ID];
            sessionRoiCollection.importList.push({
              id: data_fields.ID || data_fields.id,
              collectionType: data_fields.collectionType,
              label: data_fields.label,
              experimentId: data_fields.imageSession_ID,
              experimentLabel: referencedScan.experimentLabel,
              referencedSeriesInstanceUid: referencedScan.seriesInstanceUid,
              referencedSeriesNumber: referencedScan.seriesNumber,
              name: data_fields.name,
              date: data_fields.date,
              time: data_fields.time,
              getFilesUri: `data/archive/experiments/${data_fields.imageSession_ID}/assessors/${data_fields.ID}/files?format=json`,
            });
          }
        });

        const matchingSegment = activeSessionRoiCollection.importList.find(
          element =>
            element.referencedSeriesInstanceUid === activeSeriesInstanceUid
        );
        if (matchingSegment) {
          activeSessionRoiCollection.scanSelected =
            matchingSegment.referencedSeriesNumber;
        }

        this.setState({
          sessionRoiCollections,
          importListReady: true,
        });
      });
    });
  }

  /**
   * _updateImportingText - Updates the progressText state.
   *
   * @param  {string} roiCollectionLabel The label of the ROI Collection.
   * @returns {null}
   */
  _updateImportingText(roiCollectionLabel) {
    this.setState({
      progressText: roiCollectionLabel,
    });
  }

  /**
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
      return false;
    }

    return true;
  }

  render() {
    const {
      importListReady,
      importing,
      progressText,
      importProgress,
      sessionRoiCollections,
      sessionSelected,
    } = this.state;

    let hasCollections = false;
    for (let key of Object.keys(sessionRoiCollections)) {
      if (sessionRoiCollections[key].importList.length > 0) {
        hasCollections = true;
        break;
      }
    }

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;
    const scanSelected = currentCollection.scanSelected;
    const segmentationSelected = currentCollection.segmentationSelected;

    const sessionSelector = (
      <div className="importSessionList">
        <h5>Session</h5>
        <select
          // className="form-themed form-control"
          onChange={this.onSessionSelectedChange}
          value={sessionSelected}
        >
          {Object.keys(sessionRoiCollections).map(key => {
            const session = sessionRoiCollections[key];
            return (
              <option
                key={key}
                value={key}
                disabled={session.importList.length === 0}
              >{`${session.experimentLabel}`}</option>
            );
          })}
        </select>
      </div>
    );

    let referencedSeriesNumberList = ['All'];
    importList.forEach(roiCollection => {
      if (
        !referencedSeriesNumberList.includes(
          roiCollection.referencedSeriesNumber
        )
      ) {
        referencedSeriesNumberList.push(roiCollection.referencedSeriesNumber);
      }
    });

    let importBody;

    if (importListReady) {
      if (importing) {
        importBody = (
          <>
            <h4>{progressText}</h4>
            <h4>{`Loading Data: ${importProgress} %`}</h4>
          </>
        );
      } else if (!hasCollections) {
        importBody = <p>No data to import.</p>;
      } else if (importList.length === 0) {
        importBody = (
          <>
            {sessionSelector}
            <p>Session has no mask-based ROI collections.</p>
          </>
        );
      } else {
        importBody = (
          <>
            {sessionSelector}
            <table className="collectionTable" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th width="5%" className="centered-cell" />
                  <th width="45%">Name</th>
                  <th width="20%">Timestamp</th>
                  <th width="30%">
                    Referenced Scan #
                    <select
                      onChange={this.onSelectedScanChange}
                      value={scanSelected}
                      style={{ display: 'block', width: '100%' }}
                    >
                      {referencedSeriesNumberList.map(seriesNumber => (
                        <option key={seriesNumber} value={seriesNumber}>
                          {`${seriesNumber}`}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {importList
                  .filter(
                    roiCollection =>
                      scanSelected === 'All' ||
                      roiCollection.referencedSeriesNumber == scanSelected
                  )
                  .map(roiCollection => (
                    <tr
                      key={roiCollection.label}
                      onClick={evt => this.onChangeRadio(evt, roiCollection.id)}
                    >
                      <td className="centered-cell">
                        <input
                          className="checkboxInCell"
                          type="radio"
                          onChange={evt =>
                            this.onChangeRadio(evt, roiCollection.id)
                          }
                          checked={segmentationSelected === roiCollection.id}
                          value={roiCollection.id}
                        />
                      </td>
                      <td className="left-aligned-cell">
                        {roiCollection.name}
                      </td>
                      <td>
                        <div>{roiCollection.date}</div>
                        <div>{roiCollection.time}</div>
                      </td>
                      <td className="centered-cell">
                        {`${roiCollection.referencedSeriesNumber}`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        );
      }
    } else {
      importBody = (
        <div style={{ textAlign: 'center' }}>
          <Loader />
        </div>
      );
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Import mask-based ROI collections</h3>
          {importing ? null : (
            <button className="small" onClick={this.onCloseButtonClick}>
              <Icon name="xnat-cancel" />
            </button>
          )}
        </div>
        <div className="roiCollectionBody limitHeight">{importBody}</div>
        <div className="roiCollectionFooter">
          {importing ? null : (
            <div>
              <button onClick={this.onImportButtonClick}>
                <Icon name="xnat-import" />
                Import selected
              </button>
              <p className="warningMessage">
                <Icon name="exclamation-triangle" /> Importing another mask-collection will overwrite existing data.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
