import React, {Component} from "react";
import PropTypes from "prop-types";
import Viewer from "./viewer/viewer.js";
import { OHIF } from 'ohif-core';

function createDisplaySets(studies) {
    // Define the OHIF.viewer.data global object
    OHIF.viewer.data = OHIF.viewer.data || {};

    // @TypeSafeStudies
    // Clears OHIF.viewer.Studies collection
    OHIF.viewer.Studies.removeAll();

    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    OHIF.viewer.StudyMetadataList.removeAll();

    OHIF.viewer.data.studyInstanceUids = [];

    const updatedStudies = studies.map(study => {
        const studyMetadata = new OHIF.metadata.OHIFStudyMetadata(study, study.studyInstanceUid);
        let displaySets = study.displaySets;

        if (!study.displaySets) {
            displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
            study.displaySets = displaySets;
        }

        studyMetadata.setDisplaySets(displaySets);

        study.selected = true;
        OHIF.viewer.Studies.insert(study);
        OHIF.viewer.StudyMetadataList.insert(studyMetadata);
        OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);

        // Updates WADO-RS metaDataManager
        OHIF.viewerbase.updateMetaDataManager(study);

        return study;
    });

    return updatedStudies;
}

class ViewerFromStudyData extends Component {
    constructor(props) {
        super(props);

        this.state = {
            studies: null,
            error: null
        };
    }

    componentDidMount() {
        // TODO: Avoid using timepoints here
        //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };
        const params = {
            studyInstanceUids: this.props.studyInstanceUids,
            seriesInstanceUids: this.props.seriesInstanceUids,
        }
        const promise = OHIF.viewerbase.prepareViewerData(params);

        // Render the viewer when the data is ready
        promise.then(({ studies, viewerData }) => {
            OHIF.viewer.data = viewerData;

            const updatedStudies = createDisplaySets(studies);

            this.setState({
                studies: updatedStudies,
            });
        }).catch(error => {
            this.setState({
                error,
            });
        });

    }

    render() {
        if (this.state.error) {
            return (<div>Error: {JSON.stringify(this.state.error)}</div>);
        } else if (!this.state.studies) {
            return (<div>Loading...</div>);
        }

        return (
            <Viewer studies={this.state.studies}/>
        );
    }
}

ViewerFromStudyData.propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUids: PropTypes.array
};

export default ViewerFromStudyData;
