import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import './WindowLevelPreferences.styl';

function WindowLevelPreferencesRow({
  description,
  window,
  level,
  rowName,
  onSuccessChanged,
  onFailureChanged,
}) {
  const [rowState, setRowState] = useState({ description, window, level });

  const onInputChanged = (event, name) => {
    const newValue = event.target.value;
    setRowState({ ...rowState, [name]: newValue });
  };

  useEffect(() => {
    onSuccessChanged(rowName, rowState);
  }, [rowState]);

  const renderTd = (value, name, type) => {
    return (
      <td className="p-r-1">
        <label className="wrapperLabel">
          <input
            value={value}
            type={type}
            className="form-control"
            onChange={event => {
              onInputChanged(event, name);
            }}
          />
        </label>
      </td>
    );
  };

  return (
    <tr key={rowName}>
      <td className="p-r-1 text-center">{rowName}</td>
      {renderTd(rowState.description, 'description', 'text')}
      {renderTd(rowState.window, 'window', 'number')}
      {renderTd(rowState.level, 'level', 'number')}
    </tr>
  );
}
/**
 * WindowLevelPreferences tab
 * It renders all window level presets
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.windowLevelData Data for initial state
 * @param {function} props.onTabStateChanged Callback function to communicate parent in case its states changes
 */
function WindowLevelPreferences({ windowLevelData, name, onTabStateChanged }) {
  const [tabState, setTabState] = useState(windowLevelData);

  const onWindowLevelChanged = (key, state) => {
    setTabState({ ...tabState, [key]: state });
  };

  // tell parent to update its state
  useEffect(() => {
    onTabStateChanged(name, { windowLevelData: tabState });
  }, [tabState]);

  return (
    <table className="full-width">
      <thead>
        <tr>
          <th className="p-x-1 text-center presetIndex">Preset</th>
          <th className="p-x-1">Description</th>
          <th className="p-x-1">Window</th>
          <th className="p-x-1">Level</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(tabState).map(objKey => (
          <WindowLevelPreferencesRow
            onSuccessChanged={onWindowLevelChanged}
            rowName={objKey}
            key={objKey}
            description={tabState[objKey].description}
            window={tabState[objKey].window}
            level={tabState[objKey].level}
          ></WindowLevelPreferencesRow>
        ))}
      </tbody>
    </table>
  );
}

WindowLevelPreferences.prototype = {
  windowLevelData: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  onTabStateChanged: PropTypes.func.isRequired,
};

export { WindowLevelPreferences };
