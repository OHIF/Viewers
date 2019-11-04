import { connect } from 'react-redux';
import { UserPreferencesModal } from '@ohif/ui';
import OHIF from '@ohif/core';
import { hotkeysManager } from './../App.js';
import cloneDeep from 'lodash.clonedeep';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const isEmpty = obj => Object.keys(obj).length === 0;
  const newHotKeysData =
    state.preferences && !isEmpty(state.preferences.hotKeysData)
      ? state.preferences.hotKeysData
      : hotkeysManager.hotkeyDefinitions;
  hotkeysManager.setHotkeys(hotkeysManager.format(cloneDeep(newHotKeysData)));
  return {
    isOpen: ownProps.isOpen,
    windowLevelData: state.preferences ? state.preferences.windowLevelData : {},
    hotKeysData: newHotKeysData,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSave: ({ windowLevelData, hotKeysData }) => {
      hotkeysManager.setHotkeys(hotkeysManager.format(cloneDeep(hotKeysData)));
      ownProps.onSave();
      dispatch(setUserPreferences({ windowLevelData, hotKeysData }));
    },
    onResetToDefaults: () => {
      hotkeysManager.restoreDefaultBindings();
      ownProps.onResetToDefaults();
      dispatch(setUserPreferences());
    },
  };
};

const ConnectedUserPreferencesModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesModal);

export default ConnectedUserPreferencesModal;
