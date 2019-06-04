import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import { withRouter } from 'react-router-dom';
import { StudyList } from 'react-viewerbase';
import ConnectedHeader from '../connectedComponents/ConnectedHeader.js';
import moment from 'moment';

class StudyListWithData extends Component {
  state = {
    searchData: {},
    studies: null,
    error: null,
  };

  static propTypes = {
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

  componentDidMount() {
    // TODO: Avoid using timepoints here
    //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };

    this.searchForStudies();
  }

  searchForStudies = (
    searchData = {
      currentPage: 0,
      rowsPerPage: StudyListWithData.rowsPerPage,
      studyDateFrom: StudyListWithData.defaultStudyDateFrom,
      studyDateTo: StudyListWithData.defaultStudyDateTo,
      sortData: StudyListWithData.defaultSort,
    }
  ) => {
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

  onSelectItem = studyInstanceUID => {
    this.props.history.push(`/viewer/${studyInstanceUID}`);
  };

  onSearch = searchData => {
    this.searchForStudies(searchData);
  };

  render() {
    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    } else if (this.state.studies === null) {
      return <div>Loading...</div>;
    }

    return (
      <>
        <ConnectedHeader home={true} user={this.props.user} />
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
        />
      </>
    );
  }
}

export default withRouter(StudyListWithData);
