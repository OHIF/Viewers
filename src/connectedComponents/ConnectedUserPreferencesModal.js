import { connect } from 'react-redux';
import { UserPreferencesModal } from 'react-viewerbase';
import OHIF from 'ohif-core';
import { setUserPreferencesModalOpen } from '../redux/actions.js';
import cloneDeep from 'lodash.clonedeep';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = state => {
  const contextName = window.store.getState().commandContext.context;
  return {
    isOpen: state.ui.userPreferencesModalOpen,
    windowLevelData: state.preferences[contextName]
      ? state.preferences[contextName].windowLevelData
      : {},
    hotKeysData: state.preferences[contextName]
      ? state.preferences[contextName].hotKeysData
      : {},
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onCancel: () => {
      dispatch(setUserPreferencesModalOpen(false));
    },
    onSave: data => {
      const contextName = window.store.getState().commandContext.context;
      const preferences = cloneDeep(window.store.getState().preferences);
      preferences[contextName] = data;
      dispatch(setUserPreferences(preferences));
      dispatch(setUserPreferencesModalOpen(false));
      OHIF.hotkeysUtil.setHotkeys(data.hotKeysData);
    },
    onResetToDefaults: () => {
      dispatch(setUserPreferences());
      dispatch(setUserPreferencesModalOpen(false));
      OHIF.hotkeysUtil.setHotkeys();
    },
  };
};

const ConnectedUserPreferencesModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesModal);

export default ConnectedUserPreferencesModal;
