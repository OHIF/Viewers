import React, { Component } from "react";
import PropTypes from "prop-types";
import OHIF from 'ohif-core';
import { withRouter } from 'react-router-dom';
import { StudyList } from "react-viewerbase";
import Header from "./Header";

class StudyListWithData extends Component {
    state = {
        searchData: {},
        studies: null,
        error: null
    };

    static propTypes = {
        patientId: PropTypes.string,
        server: PropTypes.object,
        user: PropTypes.object,
        history: PropTypes.object
    };

    static rowsPerPage = 25;
    static defaultSort = { field: 'patientName', order: 'desc' };

    componentDidMount() {
        // TODO: Avoid using timepoints here
        //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };

        this.searchForStudies();
    }

    searchForStudies = (searchData = {
        currentPage: 0,
        rowsPerPage: StudyListWithData.rowsPerPage
    }) => {
        const { server } = this.props;
        const filter = {
            patientId: searchData.patientId,
            patientName: searchData.patientName,
            accessionNumber: searchData.accessionNumber,
            studyDescription: searchData.studyDescription,
            modalitiesInStudy: searchData.modalitiesInStudy,
            limit: searchData.currentPage * searchData.rowsPerPage + searchData.rowsPerPage,
            offset: searchData.currentPage * searchData.rowsPerPage
        };

        // TODO: add sorting
        const promise = OHIF.studies.searchStudies(server, filter)

        // Render the viewer when the data is ready
        promise.then(studies => {
            if (!studies) {
                studies = [];
            }

            // TODO: Fix casing of this property!
            const fixedStudies = studies.map(study => {
                const fixedStudy = study;
                fixedStudy.studyInstanceUID = study.studyInstanceUid;

                return fixedStudy;
            })

            this.setState({
                studies: fixedStudies,
            });
        }).catch(error => {
            // this.setState({
            //     error: true,
            // });

            // throw new Error(error);
        });
    }

    onImport = () => {
        //console.log('onImport');
    }

    onSelectItem = (studyInstanceUID) => {
        this.props.history.push(`/viewer/${studyInstanceUID}`);
    }

    onSearch = (searchData) => {
        // TODO: Update search filters
        this.searchForStudies(searchData);
    }

    render() {
        if (this.state.error) {
            return (<div>Error: {JSON.stringify(this.state.error)}</div>);
        } else if (this.state.studies === null) {
            return (<div>Loading...</div>);
        }

        const studyCount = this.state.studies ? this.state.studies.length : 0;

        return (<>
            <Header home={true} user={this.props.user}/>
            <StudyList studies={this.state.studies}
                studyCount={studyCount}
                studyListFunctionsEnabled={false}
                onImport={this.onImport}
                onSelectItem={this.onSelectItem}
                pageSize={this.rowsPerPage}
                defaultSort={StudyListWithData.defaultSort}
                onSearch={this.onSearch} />
        </>
        );
    }
}

export default withRouter(StudyListWithData);
