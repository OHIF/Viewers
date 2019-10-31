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
  hotkeysManager.setHotkeys(hotkeysManagerFormatter(cloneDeep(newHotKeysData)));
  return {
    isOpen: ownProps.isOpen,
    windowLevelData: state.preferences ? state.preferences.windowLevelData : {},
    hotKeysData: newHotKeysData,
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
    onSave: ({ windowLevelData, hotKeysData }) => {
      hotkeysManager.setHotkeys(
        hotkeysManagerFormatter(cloneDeep(hotKeysData))
      );
      dispatch(setUserPreferences({ windowLevelData, hotKeysData }));
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
