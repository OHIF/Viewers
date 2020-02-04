import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TabFooter } from './TabFooter';
import { HotkeyField } from '../customForm';
import { hotkeysValidators } from './hotkeysValidators';
import { MODIFIER_KEYS, ALLOWED_KEYS } from './hotkeysConfig';

import { useSnackbarContext } from '@ohif/ui';

const initialState = hotkeyDefinitions => ({
  hotkeys: { ...hotkeyDefinitions },
  errors: {},
});

const validateCommandKey = ({ commandName, pressedKeys, hotkeys }) => {
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys,
    });
    if (validation && validation.hasError) {
      return validation;
    }
  }

  return {
    hasError: false,
    errorMessage: undefined,
  };
};

/**
 * HotKeysPreferences tab
 * It renders all hotkeys displayed into columns/rows
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.onClose
 * @param {object} props.t
 * @param {object} porps.hotkeyDefinitions
 * @param {object} porps.hotkeyDefaults
 * @param {object} porps.setHotkeys
 */
function HotKeysPreferences({
  onClose,
  t,
  hotkeyDefinitions,
  hotkeyDefaults,
  setHotkeys,
}) {
  const [state, setState] = useState(initialState(hotkeyDefinitions));

  const snackbar = useSnackbarContext();

  const onResetPreferences = () => {
    const defaultHotKeyDefinitions = {};

    hotkeyDefaults.map(item => {
      const { commandName, ...values } = item;
      defaultHotKeyDefinitions[commandName] = { ...values };
    });

    setState(initialState(defaultHotKeyDefinitions));
  };

  const onSave = () => {
    const { hotkeys } = state;

    setHotkeys(hotkeys);

    localStorage.setItem('hotkey-definitions', JSON.stringify(hotkeys));

    onClose();

    snackbar.show({
      message: t('SaveMessage'),
      type: 'success',
    });
  };

  const onHotkeyChanged = (commandName, hotkeyDefinition, keys) => {
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

  const hasErrors = Object.keys(state.errors).some(key => !!state.errors[key]);
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
                {Object.entries(state.hotkeys).map(hotkey => {
                  const commandName = hotkey[0];
                  const hotkeyDefinition = hotkey[1];
                  const { keys, label } = hotkeyDefinition;
                  const errorMessage = state.errors[hotkey[0]];
                  const handleChange = keys => {
                    onHotkeyChanged(commandName, hotkeyDefinition, keys);
                  };

                  return (
                    <tr key={commandName}>
                      <td className="text-right p-r-1">{label}</td>
                      <td>
                        <label
                          data-key="defaultTool"
                          className={classnames(
                            'wrapperLabel',
                            errorMessage ? 'state-error' : ''
                          )}
                        >
                          <HotkeyField
                            keys={keys}
                            modifier_keys={MODIFIER_KEYS}
                            allowed_keys={ALLOWED_KEYS}
                            handleChange={handleChange}
                            classNames={'form-control hotkey text-center'}
                          ></HotkeyField>
                          <span className="errorMessage">{errorMessage}</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
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
