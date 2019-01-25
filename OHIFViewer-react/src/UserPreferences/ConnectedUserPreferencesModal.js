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

            const hotKeys = {};

            Object.keys(data.hotKeysData).forEach(key => {
                hotKeys[key] = data.hotKeysData[key].command;
            });

            OHIF.hotkeys.set(window.store.getState().commandContext.context, hotKeys, true);
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
