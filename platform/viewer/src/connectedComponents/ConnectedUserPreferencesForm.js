import { connect } from 'react-redux';
import { UserPreferencesForm } from '@ohif/ui';
import OHIF from '@ohif/core';
import i18n from '@ohif/i18n';

import { hotkeysManager } from '../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { defaultLanguage } = i18n;
  const { hotkeyDefinitions, windowLevelData = {}, generalPreferences } =
    state.preferences || {};
  const { hotkeyDefaults } = hotkeysManager;

  return {
    onClose: ownProps.hide,
    windowLevelData,
    hotkeyDefinitions,
    generalPreferences,
    hotkeysManager,
    hotkeyDefaults,
    defaultLanguage,
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

      if (ownProps.hide) {
        ownProps.hide();
      }

      dispatch(
        setUserPreferences({
          windowLevelData,
          hotkeyDefinitions,
          generalPreferences,
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
