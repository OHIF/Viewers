import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import OHIF from '@ohif/core';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { StudyList } from '@ohif/ui';
import ConnectedHeader from '../connectedComponents/ConnectedHeader.js';
import * as RoutesUtil from '../routes/routesUtil';
import moment from 'moment';
import ConnectedDicomFilesUploader from '../googleCloud/ConnectedDicomFilesUploader';
import ConnectedDicomStorePicker from '../googleCloud/ConnectedDicomStorePicker';
import filesToStudies from '../lib/filesToStudies.js';

const { urlUtil: UrlUtil } = OHIF.utils;
// Contexts
import UserManagerContext from '../context/UserManagerContext';
import WhiteLabellingContext from '../context/WhiteLabellingContext';
import AppContext from '../context/AppContext';

class StudyListWithData extends Component {
  static contextType = AppContext;
  state = {
    searchData: {},
    studies: [],
    error: null,
    modalComponentId: null,
  };

  static propTypes = {
    filters: PropTypes.object,
    patientId: PropTypes.string,
    server: PropTypes.object,
    user: PropTypes.object,
    history: PropTypes.object,
    studyListFunctionsEnabled: PropTypes.bool,
  };

  static defaultProps = {
    studyListFunctionsEnabled: true,
  };

  static rowsPerPage = 25;
  static defaultSort = { field: 'patientName', order: 'desc' };

  static studyListDateFilterNumDays = 25000; // TODO: put this in the settings
  static defaultStudyDateFrom = moment()
    .subtract(StudyListWithData.studyListDateFilterNumDays, 'days')
    .toDate();
  static defaultStudyDateTo = new Date();
  static defaultSearchData = {
    currentPage: 0,
    rowsPerPage: StudyListWithData.rowsPerPage,
    studyDateFrom: StudyListWithData.defaultStudyDateFrom,
    studyDateTo: StudyListWithData.defaultStudyDateTo,
    sortData: StudyListWithData.defaultSort,
  };

  componentDidMount() {
    const { appConfig = {} } = this.context;
    // TODO: Avoid using timepoints here
    //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };
    if (!this.props.server && appConfig.enableGoogleCloudAdapter) {
      this.setState({
        modalComponentId: 'DicomStorePicker',
      });
    } else {
      this.searchForStudies({
        ...StudyListWithData.defaultSearchData,
        ...(this.props.filters || {}),
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.state.searchData && !this.state.studies) {
      this.searchForStudies();
    }
    if (this.props.server !== prevProps.server) {
      this.setState({
        modalComponentId: null,
        searchData: null,
        studies: null,
      });
    }
  }

  searchForStudies = (searchData = StudyListWithData.defaultSearchData) => {
    const { server } = this.props;
    const filter = {
      patientId: searchData.patientId,
      patientName: searchData.patientName,
      accessionNumber: searchData.accessionNumber,
      studyDescription: searchData.studyDescription,
      modalitiesInStudy: searchData.modalities,
      studyDateFrom: searchData.studyDateFrom,
      studyDateTo: searchData.studyDateTo,
      limit: searchData.rowsPerPage,
      offset: searchData.currentPage * searchData.rowsPerPage,
    };

    if (server.supportsFuzzyMatching) {
      filter.fuzzymatching = true;
    }

    // TODO: add sorting
    const promise = OHIF.studies.searchStudies(server, filter);

    // Render the viewer when the data is ready
    promise
      .then(studies => {
        if (!studies) {
          studies = [];
        }

        const { field, order } = searchData.sortData;
        let sortedStudies = studies.map(study => {
          if (!moment(study.studyDate, 'MMM DD, YYYY', true).isValid()) {
            study.studyDate = moment(study.studyDate, 'YYYYMMDD').format(
              'MMM DD, YYYY'
            );
          }
          return study;
        });

        sortedStudies.sort(function(a, b) {
          let fieldA = a[field];
          let fieldB = b[field];
          if (field === 'studyDate') {
            fieldA = moment(fieldA).toISOString();
            fieldB = moment(fieldB).toISOString();
          }
          if (order === 'desc') {
            if (fieldA < fieldB) {
              return -1;
            }
            if (fieldA > fieldB) {
              return 1;
            }
            return 0;
          } else {
            if (fieldA > fieldB) {
              return -1;
            }
            if (fieldA < fieldB) {
              return 1;
            }
            return 0;
          }
        });

        this.setState({
          studies: sortedStudies,
        });
      })
      .catch(error => {
        this.setState({
          error: true,
        });

        throw new Error(error);
      });
  };

  onImport = () => {
    this.openModal('DicomFilesUploader');
  };

  openModal = modalComponentId => {
    this.setState({
      modalComponentId,
    });
  };

  closeModal = () => {
    this.setState({ modalComponentId: null });
  };

  onSelectItem = studyInstanceUID => {
    const { appConfig = {} } = this.context;
    const { server } = this.props;
    const viewerPath = RoutesUtil.parseViewerPath(appConfig, server, {
      studyInstanceUids: studyInstanceUID,
    });

    if (UrlUtil.paramString.isValidPath(viewerPath)) {
      this.props.history.push(viewerPath);
    }
  };

  updateURL(modalOpened) {
    if (!modalOpened) {
      const { appConfig = {} } = this.context;
      const { server } = this.props;
      const listPath = RoutesUtil.parseStudyListPath(appConfig, server);

      if (UrlUtil.paramString.isValidPath(listPath)) {
        const { location = {} } = this.props.history;
        if (location.pathname !== listPath) {
          this.props.history.replace(listPath);
        }
      }
    }
  }

  onSearch = searchData => {
    this.searchForStudies(searchData);
  };

  closeModals = () => {
    this.setState({
      modalComponentId: null,
    });
  };

  render() {
    const { appConfig = {} } = this.context;
    const onDrop = async acceptedFiles => {
      try {
        const studies = await filesToStudies(acceptedFiles);

        this.setState({ studies });
      } catch (error) {
        this.setState({ error });
      }
    };

    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    } else if (this.state.studies === null && !this.state.modalComponentId) {
      return <div>Loading...</div>;
    }

    let healthCareApiButtons = null;
    let healthCareApiWindows = null;

    if (appConfig.enableGoogleCloudAdapter) {
      const modalOpened = this.state.modalComponentId === 'DicomStorePicker';
      this.updateURL(modalOpened);

      healthCareApiWindows = (
        <ConnectedDicomStorePicker
          isOpen={modalOpened}
          onClose={this.closeModals}
        />
      );

      healthCareApiButtons = (
        <div
          className="form-inline btn-group pull-right"
          style={{ padding: '20px' }}
        >
          <button
            className="btn btn-primary"
            onClick={() => this.openModal('DicomStorePicker')}
          >
            {this.props.t('Change DICOM Store')}
          </button>
        </div>
      );
    }

    const studyList = (
      <div className="paginationArea">
        {this.state.studies ? (
          <StudyList
            studies={this.state.studies}
            studyListFunctionsEnabled={this.props.studyListFunctionsEnabled}
            onImport={this.onImport}
            onSelectItem={this.onSelectItem}
            pageSize={this.rowsPerPage}
            defaultSort={StudyListWithData.defaultSort}
            studyListDateFilterNumDays={
              StudyListWithData.studyListDateFilterNumDays
            }
            onSearch={this.onSearch}
          >
            {this.props.studyListFunctionsEnabled ? (
              <ConnectedDicomFilesUploader
                isOpen={this.state.modalComponentId === 'DicomFilesUploader'}
                onClose={this.closeModals}
              />
            ) : null}
            {healthCareApiButtons}
            {healthCareApiWindows}
          </StudyList>
        ) : (
          <Dropzone onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className={'drag-drop-instructions'}>
                <h3>
                  {this.props.t(
                    'Drag and Drop DICOM files here to load them in the Viewer'
                  )}
                </h3>
                <h4>
                  {this.props.t("Or click to load the browser's file selector")}
                </h4>
                <input {...getInputProps()} style={{ display: 'none' }} />
              </div>
            )}
          </Dropzone>
        )}
      </div>
    );
    return (
      <>
        <WhiteLabellingContext.Consumer>
          {whiteLabelling => (
            <UserManagerContext.Consumer>
              {userManager => (
                <ConnectedHeader
                  home={true}
                  user={this.props.user}
                  userManager={userManager}
                >
                  {whiteLabelling.logoComponent}
                </ConnectedHeader>
              )}
            </UserManagerContext.Consumer>
          )}
        </WhiteLabellingContext.Consumer>
        {studyList}
      </>
    );
  }
}

export default withRouter(withTranslation('Common')(StudyListWithData));
