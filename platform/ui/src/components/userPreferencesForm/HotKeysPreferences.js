import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import HotKeyPreferencesRow from './HotkeyPreferenceRow';

import './HotKeysPreferences.styl';

/**
 * Splits given keysObj into arrays. Each array item will be a representation of column
 * @param {obj} keysObj objects to be splitted into columns
 * @param {number} columnSize How many rows per column
 */
const getHotKeysArrayColumns = (keysObj = {}, columnSize) => {
  if (isNaN(columnSize)) {
    return keysObj;
  }

  const keys = Object.keys(keysObj);
  const keysValues = Object.values(keysObj);
  const keysLength = keys.length;

  // Columns from left should be bigger;
  let currentColumn = 0;
  const dividedKeys = [];

  for (
    let it = 0;
    it < keysLength;
    it++, it % columnSize === 0 ? currentColumn++ : currentColumn
  ) {
    if (!dividedKeys[currentColumn]) {
      dividedKeys[currentColumn] = [];
    }

    dividedKeys[currentColumn][keys[it]] = keysValues[it];
  }

  return dividedKeys;
};

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
function HotKeysPreferences({
  name = '',
  tabError = {},
  onTabStateChanged = () => {},
  onTabErrorChanged = () => {},
  hotkeysManager,
}) {
  const { hotkeyRecord, hotkeyDefinitions } = hotkeysManager;
  const [tabState, setTabState] = useState(hotkeyDefinitions);
  const [tabErrorCounter, setTabErrorCounter] = useState(0);

  const [numColumns] = useState(2);
  const [columnSize] = useState(() =>
    Math.ceil(Object.keys(tabState || {}).length / numColumns)
  );

  const splittedHotKeys = getHotKeysArrayColumns(tabState, columnSize);

  const onHotKeyChanged = (commandName, hotkeyDefinition, keys) => {
    const newState = {
      ...tabState,
      [commandName]: { ...hotkeyDefinition, keys },
    };
    setTabState(newState);
    onTabStateChanged(name, { hotkeyDefinitions: newState, hotkeyRecord });
  };

  const onErrorChanged = (toInc = true) => {
    const increment = toInc ? 1 : -1;
    const newValue = tabErrorCounter + increment;
    if (newValue >= 0) {
      setTabErrorCounter(newValue);
    }
  };

  // reset error count if tab has no errors
  useEffect(() => {
    if (!tabError) {
      setTabErrorCounter(0);
      // update tab state
      setTabState({ ...hotkeyDefinitions });
    }
  }, [tabError]);

  // tell parent to update its state
  useEffect(() => {
    if (tabErrorCounter === 0) {
      onTabErrorChanged(name, false);
    }

    if (tabErrorCounter === 1) {
      onTabErrorChanged(name, true);
    }
  }, [tabErrorCounter]);

  // update local state if parent updates
  useEffect(() => {
    setTabState({ ...hotkeyDefinitions });
  }, [hotkeyDefinitions]);

  return (
    <div className="HotKeysPreferences">
      {splittedHotKeys.length > 0
        ? splittedHotKeys.map((columnHotKeys, index) => {
            return (
              <div className="column" key={index}>
                <table className="full-width">
                  <thead>
                    <tr>
                      <th className="text-right p-r-1">Function</th>
                      <th className="text-center">Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(columnHotKeys).map(
                      hotkeyDefinitionTuple => (
                        <HotKeyPreferencesRow
                          key={hotkeyDefinitionTuple[0]}
                          commandName={hotkeyDefinitionTuple[0]}
                          hotkeys={hotkeyDefinitionTuple[1].keys}
                          label={hotkeyDefinitionTuple[1].label}
                          originalHotKeys={tabState}
                          tabError={tabError}
                          hotkeyRecord={hotkeyRecord}
                          onSuccessChanged={keys =>
                            onHotKeyChanged(
                              hotkeyDefinitionTuple[0],
                              hotkeyDefinitionTuple[1],
                              keys
                            )
                          }
                          onFailureChanged={onErrorChanged}
                        ></HotKeyPreferencesRow>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );
          })
        : null}
    </div>
  );
}

HotKeysPreferences.propTypes = {
  hotkeyDefinitions: PropTypes.any,
  name: PropTypes.string,
  tabError: PropTypes.bool,
  onTabStateChanged: PropTypes.func,
  onTabErrorChanged: PropTypes.func,
  hotkeyRecord: PropTypes.func,
};

export { HotKeysPreferences };
