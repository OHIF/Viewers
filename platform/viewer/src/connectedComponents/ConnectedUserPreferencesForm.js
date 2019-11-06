import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import { hotkeysManager } from '../App.js';
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
    onClose: ownProps.hide,
    windowLevelData: state.preferences ? state.preferences.windowLevelData : {},
    hotKeysData: newHotKeysData,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSave: ({ windowLevelData, hotKeysData }) => {
      hotkeysManager.setHotkeys(hotkeysManager.format(cloneDeep(hotKeysData)));
      ownProps.hide();
      dispatch(setUserPreferences({ windowLevelData, hotKeysData }));
    },
    onResetToDefaults: () => {
      hotkeysManager.restoreDefaultBindings();
      ownProps.hide();
      dispatch(setUserPreferences());
    },
  };
};

const ConnectedUserPreferencesForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesForm);

export default ConnectedUserPreferencesForm;
