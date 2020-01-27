import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { TabFooter } from './TabFooter';
import { HotkeyField } from '../form/HotkeyField';

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
  const { hotkeyDefinitions, hotkeyDefaults, setHotkeys } = hotkeysManager;

  const [state, setState] = useState(initialState(hotkeyDefinitions));

  const onResetPreferences = () => {
    const defaultHotKeyDefinitions = {};

    hotkeyDefaults.map(item => {
      const { commandName, ...values } = item;
      defaultHotKeyDefinitions[commandName] = { ...values };
    });

    setState(defaultHotKeyDefinitions);
  };

  const onSave = () => {
    const { hotkeys } = state;

    setHotkeys(hotkeys);

    localStorage.setItem('hotkey-definitions', JSON.stringify(hotkeys));
  };

  const hasErrors = () => {
    return !!Object.keys(state.errors).length;
  };

  // const onHotKeyChanged = (commandName, hotkeyDefinition, keys) => {
  //   const newState = {
  //     ...tabState,
  //     [commandName]: { ...hotkeyDefinition, keys },
  //   };
  //   setTabState(newState);
  //   onTabStateChanged(name, { hotkeyDefinitions: newState, hotkeyRecord });
  // };

  // const onErrorChanged = (toInc = true) => {
  //   const increment = toInc ? 1 : -1;
  //   const newValue = tabErrorCounter + increment;
  //   if (newValue >= 0) {
  //     setTabErrorCounter(newValue);
  //   }
  // };

  const onChange = () => {};
  const onBlur = () => {};
  const onKeyDown = () => {};

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
                {Object.entries(state.hotkeys).map((hotkeys, index) => (
                  <tr key={hotkeys[0]}>
                    <td className="text-right p-r-1">{hotkeys[1].label}</td>
                    <td>
                      <HotkeyField
                        name={hotkeys[0]}
                        value={hotkeys[1].keys}
                        className="form-control hotkey text-center"
                        onChange={onChange}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                      />
                      {false && <span className="errorMessage">ERROR</span>}
                    </td>
                  </tr>
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
