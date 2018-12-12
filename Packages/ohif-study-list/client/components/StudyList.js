import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Blaze from 'meteor/gadicc:blaze-react-component';
import { OHIF } from 'meteor/ohif:core';
import './StudyList.css';

class StudyList extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <div className='StudyList'>
                <Blaze template="studylist" className='tempStudyList'/>
            </div>
        );
    }
}

StudyList.propTypes = {
    studies: PropTypes.array
};

OHIF.studylist.components = {
    StudyList
};

export default StudyList;
