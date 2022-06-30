import React from 'react';
import PropTypes from 'prop-types';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import cornerstoneTools from 'cornerstone-tools';
import sessionMap from '../../utils/sessionMap';
import getReferencedScan from '../../utils/getReferencedScan';
import { Icon } from '@ohif/ui';
import { Loader } from '../../elements';
import importContourRoiCollections from '../../utils/IO/importContourRoiCollections';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

export default class XNATContourImportMenu extends React.Component {
  static propTypes = {
    onImportComplete: PropTypes.any,
    onImportCancel: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    viewportData: PropTypes.any,
  };

  static defaultProps = {
    onImportComplete: undefined,
    onImportCancel: undefined,
    SeriesInstanceUID: undefined,
    viewportData: undefined,
  };

  constructor(props = {}) {
    super(props);

    const interpolate = modules.freehand3D.state.interpolate;
    if (interpolate) {
      // disable interpolation during import
      modules.freehand3D.state.interpolate = false;
    }

    this._subjectId = sessionMap.getSubject();
    this._projectId = sessionMap.getProject();

    const sessionSelected = sessionMap.getScan(
      props.SeriesInstanceUID,
      'experimentId'
    );

    this._sessions = sessionMap.getSession();
    const sessionRoiCollections = {};
    for (let i = 0; i < this._sessions.length; i++) {
      const experimentId = this._sessions[i].experimentId;
      sessionRoiCollections[experimentId] = {
        experimentLabeL: this._sessions[i].experimentLabeL,
        importList: [],
        selectAllChecked: false,
        scanSelected: 'All',
      };
    }

    this.state = {
      sessionRoiCollections,
      sessionSelected,
      importListReady: false,
      importing: false,
      progressText: [],
      importProgress: '',
      interpolate: interpolate,
    };

    this._cancelablePromises = [];
    this._validTypes = ['AIM', 'RTSTRUCT'];

    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._getVolumeManagementLabels = this._getVolumeManagementLabels.bind(
      this
    );
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );
    this._updateImportingText = this._updateImportingText.bind(this);

    this.updateProgress = this.updateProgress.bind(this);
    this.onReferencedSeriesChange = this.onReferencedSeriesChange.bind(this);
    this.onSessionSelectedChange = this.onSessionSelectedChange.bind(this);
  }

  updateProgress(status) {
    this.setState({ importProgress: status });
    // console.log(status);
  }

  onReferencedSeriesChange(evt) {
    const { sessionRoiCollections, sessionSelected } = this.state;
    const currentCollection = sessionRoiCollections[sessionSelected];
    currentCollection.scanSelected = evt.target.value;

    this.setState({ sessionRoiCollections });
  }

  onSessionSelectedChange(evt) {
    this.setState({ sessionSelected: evt.target.value });
  }

  /**
   * onCloseButtonClick - Closes the dialog.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onImportCancel();
  }

  /**
   * onChangeSelectAllCheckbox - Check all checkboxes.
   *
   * @param  {Object} evt The event.
   * @returns {null}
   */
  onChangeSelectAllCheckbox(evt) {
    const checked = evt.target.checked;
    const { sessionRoiCollections, sessionSelected } = this.state;

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;
    currentCollection.selectAllChecked = checked;
    const scanSelected = currentCollection.scanSelected;

    for (let i = 0; i < importList.length; i++) {
      if (
        scanSelected === 'All' ||
        importList[i].referencedSeriesNumber == scanSelected
      ) {
        importList[i].selected = checked;
      }
    }

    this.setState({ sessionRoiCollections });
  }

  /**
   * onChangeCheckbox - Check/uncheck a checkbox.
   *
   * @param  {Object} evt   The event.
   * @param  {number} index number
   * @returns {null}
   */
  onChangeCheckbox(evt, id) {
    const checked = evt.target.checked;
    const { sessionRoiCollections, sessionSelected } = this.state;

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;

    for (let i = 0; i < importList.length; i++) {
      if (importList[i].id === id) {
        importList[i].selected = checked;
        break;
      }
    }

    this.setState({ sessionRoiCollections });
  }

  /**
   * async onImportButtonClick - Exports the current mask to XNAT.
   *
   * @returns {null}
   */
  async onImportButtonClick() {
    const { sessionRoiCollections, sessionSelected } = this.state;

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;
    const scanSelected = currentCollection.scanSelected;

    const collectionsToParse = importList.filter(
      collection =>
        collection.selected &&
        (scanSelected === 'All' ||
          collection.referencedSeriesNumber == scanSelected)
    );

    if (collectionsToParse.length === 0) {
      return;
    }

    // this._updateImportingText('');
    this.setState({ importing: true });

    await importContourRoiCollections(collectionsToParse, {
      updateImportingText: this._updateImportingText,
      onImportComplete: this.props.onImportComplete,
      updateProgress: this.updateProgress,
    });
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

    if (this.state.interpolate) {
      // reinstate interpolation flag if it was enabled
      modules.freehand3D.state.interpolate = this.state.interpolate;
    }
  }

  /**
   * componentDidMount - On mounting, fetch a list of available ROICollections from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    const { SeriesInstanceUID: activeSeriesInstanceUid } = this.props;
    const { sessionRoiCollections, sessionSelected } = this.state;

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

    this._volumeManagementLabels = this._getVolumeManagementLabels();

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
              selected: false,
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
   * _updateImportingText - Update the importing text.
   *
   * @param  {string} roiCollectionLabel The lable of the ROI Collection.
   * @returns {null}
   */
  _updateImportingText(progressText) {
    this.setState({ progressText });
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
    // const children = item.children;

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
      return false;
    }

    // Check collection isn't already imported.
    const roiCollectionLabel = item.data_fields.label;

    const collectionAlreadyImported = this._volumeManagementLabels.some(
      label => label === roiCollectionLabel
    );

    if (collectionAlreadyImported) {
      return false;
    }

    return true;
  }

  /**
   * _getVolumeManagementLabels - Construct a list of roiCollections
   *                               already imported.
   *
   * @returns {string[]} An array of the labels of roiCollections already imported.
   */
  _getVolumeManagementLabels() {
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

    if (importing) {
      return (
        <div className="xnatPanel">
          <div className="panelHeader">
            <h3>Import contour-based ROI collections</h3>
          </div>
          <div className="roiCollectionBody limitHeight">
            {progressText[0] && <h4>{progressText[0]}</h4>}
            {progressText[1] && <h4>{progressText[1]}</h4>}
            <h4>{importProgress}</h4>
          </div>
        </div>
      );
    }

    let hasCollections = false;
    for (let key of Object.keys(sessionRoiCollections)) {
      if (sessionRoiCollections[key].importList.length > 0) {
        hasCollections = true;
        break;
      }
    }

    const currentCollection = sessionRoiCollections[sessionSelected];
    const importList = currentCollection.importList;
    const selectAllChecked = currentCollection.selectAllChecked;
    const scanSelected = currentCollection.scanSelected;

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
              >{`${session.experimentLabeL}`}</option>
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
      if (!hasCollections) {
        importBody = <p>No data to import.</p>;
      } else if (importList.length === 0) {
        importBody = (
          <>
            {sessionSelector}
            <p>Session has no contour-based ROI collections.</p>
          </>
        );
      } else {
        importBody = (
          <>
            {sessionSelector}
            <table className="collectionTable" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    <input
                      type="checkbox"
                      className="checkboxInCell"
                      checked={selectAllChecked}
                      value={selectAllChecked}
                      onChange={this.onChangeSelectAllCheckbox}
                    />
                  </th>
                  <th width="45%">Name</th>
                  <th width="20%">Timestamp</th>
                  <th width="30%">
                    Referenced Scan #
                    <select
                      onChange={this.onReferencedSeriesChange}
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
                    <tr key={`${roiCollection.id}`}>
                      <td className="centered-cell">
                        <input
                          type="checkbox"
                          className="checkboxInCell"
                          onChange={evt =>
                            this.onChangeCheckbox(evt, roiCollection.id)
                          }
                          checked={roiCollection.selected}
                          value={roiCollection.selected}
                        />
                      </td>
                      <td className="left-aligned-cell">
                        {roiCollection.name}
                      </td>
                      <td>{`${roiCollection.date} ${roiCollection.time}`}</td>
                      <td className="centered-cell">
                        {`${roiCollection.referencedSeriesNumber}`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="roiCollectionFooter">
              <button onClick={this.onImportButtonClick}>
                <Icon name="xnat-import" />
                Import selected
              </button>
            </div>
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
          <h3>Import contour-based ROI collections</h3>
          <button className="small" onClick={this.onCloseButtonClick}>
            <Icon name="xnat-cancel" />
          </button>
        </div>
        <div className="roiCollectionBody limitHeight">{importBody}</div>
      </div>
    );
  }
}
