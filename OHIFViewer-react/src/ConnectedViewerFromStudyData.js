import { connect } from 'react-redux';

import ViewerFromStudyData from './ViewerFromStudyData.js';

const isActive = (a) => a.active === true;

const mapStateToProps = (state, ownProps) => {
    const activeServer = state.servers.servers.find(isActive);

    return {
        server: activeServer,
        ...ownProps
    };
};

const ConnectedViewerFromStudyData = connect(
    mapStateToProps,
    null
)(ViewerFromStudyData);

export default ConnectedViewerFromStudyData;
