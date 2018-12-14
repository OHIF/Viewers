import React, { Component } from "react";
import PropTypes from "prop-types";
import ViewerFromStudyData from "./ViewerFromStudyData.js";

function IHEInvokeImageDisplay({ match }) {
    const requestType = match.params.query.requestType;

    let studyInstanceUids;
    let displayStudyList = false;
    if (requestType === "STUDY") {
        studyInstanceUids = match.params.query.studyUID.split(';');
    } else if (requestType === "STUDYBASE64") {
        const uids = this.params.query.studyUID;
        const decodedData = window.atob(uids);
        studyInstanceUids = decodedData.split(';');
    } else if (requestType === "PATIENT") {
        const patientUids = this.params.query.patientID.split(';');
        displayStudyList = true
    } else {
        displayStudyList = true
    }

    if (displayStudyList) {
        //return (<StudyList/>);
        return ('');
    }

    return (
        <ViewerFromStudyData studyInstanceUids={studyInstanceUids}/>
    );
}

export default IHEInvokeImageDisplay;
