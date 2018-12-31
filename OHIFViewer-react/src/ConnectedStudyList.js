import { connect } from 'react-redux';

import StudyListWithData from './StudyListWithData.js';

const isActive = (a) => a.active === true;

const mapStateToProps = (state, ownProps) => {
    const activeServer = state.servers.servers.find(isActive);

    return {
        server: activeServer,
        ...ownProps
    };
};

const ConnectedStudyList = connect(
    mapStateToProps,
    null
)(StudyListWithData);

export default ConnectedStudyList;
