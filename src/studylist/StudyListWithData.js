import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import { withRouter } from 'react-router-dom';
import { StudyList } from 'react-viewerbase';
import ConnectedHeader from '../connectedComponents/ConnectedHeader.js';
import moment from 'moment';
import ConnectedDicomFilesUploader from '../googleCloud/ConnectedDicomFilesUploader';
import ConnectedDicomStorePicker from '../googleCloud/ConnectedDicomStorePicker';

class StudyListWithData extends Component {
  state = {
    searchData: {},
    studies: [],
    error: null,
    modalComponentId: null,
    showStudyList: true,
  };

  static propTypes = {
    filters: PropTypes.object,
    patientId: PropTypes.string,
    server: PropTypes.object,
    user: PropTypes.object,
    history: PropTypes.object,
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
    // TODO: Avoid using timepoints here
    //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };
    if (!this.props.server && window.config.enableGoogleCloudAdapter) {
      this.setState({
        modalComponentId: 'DicomStorePicker',
        showStudyList: false,
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
        showStudyList: true,
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
    //console.log('onImport');
  };

  openModal = modalComponentId => {
    this.setState({
      modalComponentId,
      showStudyList: false,
    });
  };

  closeModal = () => {
    this.setState({ modalComponentId: null });
  };

  onSelectItem = studyInstanceUID => {
    this.props.history.push(`/viewer/${studyInstanceUID}`);
  };

  onSearch = searchData => {
    this.searchForStudies(searchData);
  };

  update = () => {
    this.setState({
      modalComponentId: null,
      showStudyList: true,
    });
  };

  render() {
    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    } else if (this.state.studies === null && !this.state.modalComponentId) {
      return <div>Loading...</div>;
    }

    let healthCareApiButtons = '';
    let healthCareApiWindows = '';
    if (window.config.enableGoogleCloudAdapter) {
      if (this.state.modalComponentId) {
        if (this.state.modalComponentId === 'DicomStorePicker') {
          healthCareApiWindows = (
            <ConnectedDicomStorePicker onClose={this.update} />
          );
        } else if (this.state.modalComponentId === 'DicomFilesUploader') {
          healthCareApiWindows = (
            <ConnectedDicomFilesUploader onClose={this.update} />
          );
        }
        healthCareApiWindows = (
          <>
            <div className="col-md-4 col-md-offset-2 layoutChooser pagination-area">
              {healthCareApiWindows}
            </div>
          </>
        );
      }
      healthCareApiButtons = (
        <>
          <div className="form-inline form-group pull-right">
            <button
              className="btn btn-primary "
              onClick={() => this.openModal('DicomStorePicker')}
            >
              Change Dicom Store
            </button>
            <button
              className="btn btn-primary"
              onClick={() => this.openModal('DicomFilesUploader')}
            >
              Upload Studies
            </button>
          </div>
        </>
      );
    }
    let studyList = <></>;
    studyList = (
      <div name="paginationArea">
        <StudyList
          studies={this.state.studies}
          studyListFunctionsEnabled={false}
          onImport={this.onImport}
          onSelectItem={this.onSelectItem}
          pageSize={this.rowsPerPage}
          defaultSort={StudyListWithData.defaultSort}
          studyListDateFilterNumDays={
            StudyListWithData.studyListDateFilterNumDays
          }
          onSearch={this.onSearch}
        >
          {healthCareApiButtons}
          {healthCareApiWindows}
        </StudyList>
      </div>
    );
    return (
      <>
        <ConnectedHeader home={true} user={this.props.user} />
        {studyList}
      </>
    );
  }
}

export default withRouter(StudyListWithData);
