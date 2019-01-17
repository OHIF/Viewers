import { connect } from 'react-redux';
import ToolbarRow from './ToolbarRow';
import { setLeftSidebarOpen, setRightSidebarOpen } from '../redux/actions.js';

const mapStateToProps = state => {
    return {
        leftSidebarOpen: state.ui.leftSidebarOpen,
        rightSidebarOpen: state.ui.rightSidebarOpen
    };
};


const mapDispatchToProps = dispatch => {
    return {
        setLeftSidebarOpen: state => {
            dispatch(setLeftSidebarOpen(state))
        },
        setRightSidebarOpen: state => {
            dispatch(setRightSidebarOpen(state))
        }
    };
};

const ConnectedToolbarRow = connect(
    mapStateToProps,
    mapDispatchToProps
)(ToolbarRow);

export default ConnectedToolbarRow;
