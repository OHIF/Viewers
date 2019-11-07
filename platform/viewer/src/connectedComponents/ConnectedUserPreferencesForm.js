import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const hotkeyDefinitions =
    state.preferences.hotkeyDefinitions.length > 0
      ? state.preferences.hotkeyDefinitions
      : hotkeysManager.hotkeyDefaults;
  hotkeysManager.setHotkeys(hotkeyDefinitions);
  return {
    onClose: ownProps.hide,
    windowLevelData: state.preferences ? state.preferences.windowLevelData : {},
    hotkeyDefinitions,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSave: ({ windowLevelData, hotkeyDefinitions }) => {
      hotkeysManager.setHotkeys(hotkeyDefinitions);
      ownProps.hide();
      dispatch(setUserPreferences({ windowLevelData, hotkeyDefinitions }));
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
