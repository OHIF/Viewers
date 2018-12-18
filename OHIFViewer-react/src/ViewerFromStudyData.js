import React, {Component} from "react";
import PropTypes from "prop-types";
import OHIF from 'ohif-core';
import Viewer from "./Viewer/Viewer.js";
import createDisplaySets from './lib/createDisplaySets.js';

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
        const { studyInstanceUids, seriesInstanceUids, server } = this.props;
        const promise = OHIF.studies.retrieveStudiesMetadata(server, studyInstanceUids, seriesInstanceUids)

        // Render the viewer when the data is ready
        promise.then(studies => {
            const updatedStudies = createDisplaySets(studies);

            this.setState({
                studies: updatedStudies,
            });
        }).catch(error => {
            this.setState({
                error: true,
            });

            console.error(error);
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
    seriesInstanceUids: PropTypes.array,
    server: PropTypes.object
};

export default ViewerFromStudyData;
