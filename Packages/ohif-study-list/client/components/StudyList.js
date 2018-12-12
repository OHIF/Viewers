import React, { Component } from 'react';
import Blaze from 'meteor/gadicc:blaze-react-component';

class StudyList extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <div className='StudyList'>
                <Blaze template="studylist" />
            </div>
        );
    }
}

StudyList.propTypes = {
    studies: PropTypes.array.isRequired
};

OHIF.studylist.components = {
    StudyList
};

export default StudyList;
