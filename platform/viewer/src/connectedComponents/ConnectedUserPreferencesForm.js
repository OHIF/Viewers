import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { hotkeyDefinitions, windowLevelData = {} } = state.preferences || {};

  return {
    onClose: ownProps.hide,
    windowLevelData,
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
      const { hotkeyDefinitions } = hotkeysManager;
      dispatch(setUserPreferences({ hotkeyDefinitions }));
    },
  };
};

const ConnectedUserPreferencesForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesForm);

export default ConnectedUserPreferencesForm;
