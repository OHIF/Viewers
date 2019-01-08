import { connect } from 'react-redux';
import FlexboxLayout from './FlexboxLayout';

const mapStateToProps = state => {
    return {
        leftSidebarOpen: state.ui.leftSidebarOpen,
        rightSidebarOpen: state.ui.rightSidebarOpen,
        stackLoadingData: state.loading
    };
};

const ConnectedFlexboxLayout = connect(
    mapStateToProps,
    null
)(FlexboxLayout);

export default ConnectedFlexboxLayout;
