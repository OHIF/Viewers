import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import i18n from '@ohif/i18n';

import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { hotkeyDefinitions, windowLevelData = {}, generalPreferences } =
    state.preferences || {};

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

      const { language } = generalPreferences;

      // set new language
      i18n.changeLanguage(language);

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
      const { hotkeyDefinitions } = hotkeysManager;

      // restore default language
      const { defaultLanguage } = i18n;
      i18n.changeLanguage(defaultLanguage);

      dispatch(
        setUserPreferences({
          hotkeyDefinitions,
          generalPreferences: { language: defaultLanguage },
        })
      );
    },
  };
};

const ConnectedUserPreferencesForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesForm);

export default ConnectedUserPreferencesForm;
