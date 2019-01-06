import { connect } from 'react-redux';
import { LayoutManager } from 'react-viewerbase';

const mapStateToProps = state => {
    return {
        layout: state.viewports.layout,
        activeViewportIndex: state.viewports.activeViewportIndex
    };
};

const ConnectedLayoutManager = connect(
    mapStateToProps,
    null
)(LayoutManager);

export default ConnectedLayoutManager;
