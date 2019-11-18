import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import i18n from '@ohif/i18n';

import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { generalPreferences } = state.preferences;
  const hotkeyDefinitions =
    state.preferences.hotkeyDefinitions.length > 0
      ? state.preferences.hotkeyDefinitions
      : hotkeysManager.hotkeyDefaults;
  hotkeysManager.setHotkeys(hotkeyDefinitions);
  return {
    onClose: ownProps.hide,
    windowLevelData: state.preferences ? state.preferences.windowLevelData : {},
    hotkeyDefinitions,
    generalPreferences,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSave: ({ windowLevelData, hotkeyDefinitions, generalPreferences }) => {
      hotkeysManager.setHotkeys(hotkeyDefinitions);

      i18n.init({
        fallbackLng: generalPreferences.language,
        lng: generalPreferences.language,
      });

      ownProps.hide();
      dispatch(
        setUserPreferences({
          windowLevelData,
          hotkeyDefinitions,
          generalPreferences,
        })
      );
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
