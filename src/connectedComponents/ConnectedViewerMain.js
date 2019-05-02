import { connect } from 'react-redux';
import ViewerMain from './ViewerMain';
import OHIF from 'ohif-core';

const { setViewportSpecificData, clearViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = state => {
    const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

    return {
        activeViewportIndex,
        layout,
        viewportSpecificData
    }
};

const mapDispatchToProps = dispatch => {
    return {
        setViewportSpecificData: (viewportIndex, data) => {
            dispatch(setViewportSpecificData(viewportIndex, data));
        },
        clearViewportSpecificData: () => {
            dispatch(clearViewportSpecificData());
        }
    };
};

const ConnectedViewerMain = connect(
    mapStateToProps,
    mapDispatchToProps
)(ViewerMain);

export default ConnectedViewerMain;
