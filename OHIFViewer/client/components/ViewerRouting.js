import React, {Component} from "react";
import PropTypes from "prop-types";
import ViewerFromStudyData from "./ViewerFromStudyData.js";

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
        <ViewerFromStudyData studyInstanceUids={studyUIDs} seriesInstanceUids={seriesUIDs}/>
    );
}

export default ViewerRouting;
