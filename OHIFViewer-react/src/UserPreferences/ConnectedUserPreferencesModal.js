import { connect } from 'react-redux';
import { UserPreferencesModal } from 'react-viewerbase';
import OHIF from 'ohif-core';
import { setUserPreferencesModalOpen } from '../redux/actions.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = state => {
    return {
        isOpen: state.ui.userPreferencesModalOpen,
        windowLevelData: state.preferences.windowLevelData,
        hotKeysData: state.preferences.hotKeysData
    };
};

const mapDispatchToProps = dispatch => {
    return {
        onCancel: () => {
            dispatch(setUserPreferencesModalOpen(false));
        },
        onSave: data => {
            dispatch(setUserPreferences(data));
            dispatch(setUserPreferencesModalOpen(false));
            Object.keys(data.hotKeysData).forEach(key => {
                OHIF.hotkeys.register(
                    window.store.getState().commandContext.context,
                    key,
                    data.hotKeysData[key].command
                );
            });
        },
        onResetToDefaults: () => {
            dispatch(setUserPreferences());
            dispatch(setUserPreferencesModalOpen(false));
        },
    };
};

const ConnectedUserPreferencesModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(UserPreferencesModal);

export default ConnectedUserPreferencesModal;
