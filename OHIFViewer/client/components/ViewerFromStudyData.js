import React, {Component} from "react";
import PropTypes from "prop-types";
import Viewer from "./viewer/viewer.js";
import { OHIF } from 'meteor/ohif:core';

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
            this.setState({
                studies,
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
    studyInstanceUids: PropTypes.array,
    seriesInstanceUids: PropTypes.array
};

export default ViewerFromStudyData;
