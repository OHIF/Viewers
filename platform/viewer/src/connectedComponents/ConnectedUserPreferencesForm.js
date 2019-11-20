import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import i18n from '@ohif/i18n';

import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { generalPreferences } = state.preferences;
  const { hotkeyDefinitions, windowLevelData = {} } = state.preferences || {};

  return {
    onClose: ownProps.hide,
    windowLevelData,
    hotkeyDefinitions,
    generalPreferences,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSave: ({ windowLevelData, hotkeyDefinitions, generalPreferences }) => {
      // TODO improve this strategy on windowLevel implementation
      hotkeysManager.setHotkeys(hotkeyDefinitions);

      // set new language
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
