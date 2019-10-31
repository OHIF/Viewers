import { connect } from 'react-redux';
import { UserPreferencesModal } from '@ohif/ui';
import OHIF from '@ohif/core';
import cloneDeep from 'lodash.clonedeep';
import { hotkeysManager } from './../App.js';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const contextName = 'viewer';
  const viewerPreferences = state.preferences[contextName];
  const isEmpty = obj => Object.keys(obj).length === 0;
  return {
    isOpen: ownProps.isOpen,
    windowLevelData: viewerPreferences ? viewerPreferences.windowLevelData : {},
    hotKeysData:
      viewerPreferences && !isEmpty(viewerPreferences.hotKeysData)
        ? viewerPreferences.hotKeysData
        : hotkeysManager.hotkeyDefinitions,
  };
};

/* HotkeysManager's hotkeysDefinitions have different output/input. */
const hotkeysManagerFormatter = hotKeysData => {
  const hotKeysCommands = Object.keys(hotKeysData);
  return hotKeysCommands.map(commandName => {
    const definition = hotKeysData[commandName];

    return {
      commandName,
      keys: definition.keys,
      label: definition.label,
    };
  });
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onLoad: hotKeysData => {
      hotkeysManager.setHotkeys(hotkeysManagerFormatter(hotKeysData));
    },
    onSave: newUserPreferences => {
      const { windowLevelData, hotKeysData } = newUserPreferences;
      const contextName = 'viewer'; // window.store.getState().commandContext.context;
      const preferences = cloneDeep(window.store.getState().preferences);
      preferences[contextName] = { windowLevelData, hotKeysData };
      hotkeysManager.setHotkeys(hotkeysManagerFormatter(hotKeysData));
      dispatch(setUserPreferences(preferences));
      ownProps.onSave();
    },
    onResetToDefaults: () => {
      hotkeysManager.restoreDefaultBindings();
      dispatch(setUserPreferences());
      ownProps.onResetToDefaults();
    },
  };
};

const ConnectedUserPreferencesModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserPreferencesModal);

export default ConnectedUserPreferencesModal;
