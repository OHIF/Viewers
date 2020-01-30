import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { TabFooter } from './TabFooter';
import HotKeyPreferencesRow from './HotkeyPreferenceRow';
import { validateCommandKey } from './validateCommandKey';

const initialState = hotkeyDefinitions => ({
  hotkeys: { ...hotkeyDefinitions },
  errors: {},
});

/**
 * HotKeysPreferences tab
 * It renders all hotkeys displayed into columns/rows
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.hotkeyDefinitions Data for initial state
 * @param {function} props.onTabStateChanged Callback function to communicate parent in case its states changes
 * @param {function} props.onTabErrorChanged Callback Function in case any error on tab
 */
function HotKeysPreferences({ onClose, t, hotkeysManager }) {
  const {
    hotkeyDefinitions,
    hotkeyDefaults,
    record: hotkeyRecord,
    setHotkeys,
  } = hotkeysManager;

  const [state, setState] = useState(initialState(hotkeyDefinitions));

  const onResetPreferences = () => {
    const defaultHotKeyDefinitions = {};

    hotkeyDefaults.map(item => {
      const { commandName, ...values } = item;
      defaultHotKeyDefinitions[commandName] = { ...values };
    });

    setState(initialState(defaultHotKeyDefinitions));
  };

  const onSave = values => {
    setHotkeys(values);

    localStorage.setItem('hotkey-definitions', JSON.stringify(values));
  };

  const onHotKeyChanged = (commandName, hotkeyDefinition, keys) => {
    const { errorMessage } = validateCommandKey({
      commandName,
      pressedKeys: keys,
      hotkeys: state.hotkeys,
    });

    setState(prevState => ({
      hotkeys: {
        ...prevState.hotkeys,
        [commandName]: { ...hotkeyDefinition, keys },
      },
      errors: {
        ...prevState.errors,
        [commandName]: errorMessage,
      },
    }));
  };

  const hasErrors = () => {
    // TODO: Update this function
    return !!Object.keys(state.errors).length;
  };

  const hasHotkeys = Object.keys(state.hotkeys).length;

  return (
    <React.Fragment>
      <div className="HotKeysPreferences">
        {hasHotkeys && (
          <div className="column">
            <table className="full-width">
              <thead>
                <tr>
                  <th className="text-right p-r-1">Function</th>
                  <th className="text-center">Shortcut</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(state.hotkeys).map(hotkey => (
                  <HotKeyPreferencesRow
                    key={hotkey[0]}
                    commandName={hotkey[0]}
                    hotkeys={hotkey[1].keys}
                    label={hotkey[1].label}
                    errorMessage={state.errors[hotkey[0]]}
                    hotkeyRecord={hotkeyRecord}
                    onHotkeyChanged={keys =>
                      onHotKeyChanged(hotkey[0], hotkey[1], keys)
                    }
                  ></HotKeyPreferencesRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <TabFooter
        onResetPreferences={onResetPreferences}
        onSave={onSave}
        onClose={onClose}
        hasErrors={hasErrors}
        t={t}
      />
    </React.Fragment>
  );
}

HotKeysPreferences.propTypes = {
  hide: PropTypes.func,
  t: PropTypes.func,
  hotkeysManager: PropTypes.object,
};

export { HotKeysPreferences };
