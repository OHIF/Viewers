import React from "react";
import PropTypes from "prop-types";
import ConnectedViewerFromStudyData from "./ConnectedViewerFromStudyData";

// TODO: Move to react-viewerbase

function ViewerRouting({ match }) {
    const { studyInstanceUids, seriesInstanceUids } = match.params;

    let studyUIDs;
    let seriesUIDs;

    if (studyInstanceUids && !seriesInstanceUids) {
        studyUIDs = studyInstanceUids.split(';');
    } else if (studyInstanceUids && seriesInstanceUids) {
        studyUIDs = [match.params.studyInstanceUid];
        seriesUIDs = match.params.seriesInstanceUids.split(';');
    }

    return (
        <ConnectedViewerFromStudyData studyInstanceUids={studyUIDs} seriesInstanceUids={seriesUIDs}/>
    );
}

ViewerRouting.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            studyInstanceUids: PropTypes.string.isRequired,
            seriesInstanceUids: PropTypes.string
        })
    })
};

export default ViewerRouting;
