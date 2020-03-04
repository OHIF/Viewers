import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { useSnackbarContext, TabFooter, HotkeyField } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

import { hotkeysValidators } from './hotkeysValidators';
import { MODIFIER_KEYS } from './hotkeysConfig';

import { hotkeysManager } from '../../App';

import './HotkeysPreferences.styl';
/**
 * Take hotkeyDefenintions and build an initialState to be used into the component state
 *
 * @param {Object} hotkeyDefinitions
 * @returns {Object} initialState
 */
const initialState = hotkeyDefinitions => ({
  hotkeys: { ...hotkeyDefinitions },
  errors: {},
});
/**
 * Take the updated command and keys and validate the changes with all validators
 *
 * @param {Object} arguments
 * @param {string} arguments.commandName command name string to be updated
 * @param {array} arguments.pressedKeys new array of keys to be added for the commandName
 * @param {array} arguments.hotkeys all hotkeys currently into the app
 * @returns {Object} {errorMessage} errorMessage coming from any of the validator or undefined if none
 */
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
    errorMessage: undefined,
  };
};

/**
 * Take all hotkeys and split the list into two lists
 *
 * @param {array} hotkeys list of all hotkeys
 * @returns {array} array containing two arrays of keys
 */
const splitHotkeys = hotkeys => {
  const splitedHotkeys = [];
  const arrayHotkeys = Object.entries(hotkeys);

  if (arrayHotkeys.length) {
    const halfwayThrough = Math.ceil(arrayHotkeys.length / 2);
    splitedHotkeys.push(arrayHotkeys.slice(0, halfwayThrough));
    splitedHotkeys.push(
      arrayHotkeys.slice(halfwayThrough, arrayHotkeys.length)
    );
  }

  return splitedHotkeys;
};

/**
 * HotkeysPreferences tab
 * It renders all hotkeys displayed into columns/rows
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.onClose
 */
function HotkeysPreferences({ onClose }) {
  const { t } = useTranslation('UserPreferencesModal');
  const { hotkeyDefaults, hotkeyDefinitions } = hotkeysManager;

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

    hotkeysManager.setHotkeys(hotkeys);

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
  const splitedHotkeys = splitHotkeys(state.hotkeys);

  return (
    <React.Fragment>
      <div className="HotkeysPreferences">
        {hasHotkeys ? (
          <div className="hotkeyTable">
            {splitedHotkeys.map((hotkeys, index) => {
              return (
                <div className="hotkeyColumn" key={index}>
                  <div className="hotkeyHeader">
                    <div className="headerItemText text-right">Function</div>
                    <div className="headerItemText text-center">Shortcut</div>
                  </div>
                  {hotkeys.map(hotkey => {
                    const commandName = hotkey[0];
                    const hotkeyDefinition = hotkey[1];
                    const { keys, label } = hotkeyDefinition;
                    const errorMessage = state.errors[hotkey[0]];
                    const handleChange = keys => {
                      onHotkeyChanged(commandName, hotkeyDefinition, keys);
                    };

                    return (
                      <div key={commandName} className="hotkeyRow">
                        <div className="hotkeyLabel">{label}</div>
                        <div
                          data-key="defaultTool"
                          className={classnames(
                            'wrapperHotkeyInput',
                            errorMessage ? 'stateError' : ''
                          )}
                        >
                          <HotkeyField
                            keys={keys}
                            modifier_keys={MODIFIER_KEYS}
                            handleChange={handleChange}
                            classNames={'preferencesInput'}
                          ></HotkeyField>
                          <span className="preferencesInputErrorMessage">
                            {errorMessage}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          'Hotkeys definitions is empty'
        )}
      </div>
      <TabFooter
        onResetPreferences={onResetPreferences}
        onSave={onSave}
        onCancel={onClose}
        hasErrors={hasErrors}
        t={t}
      />
    </React.Fragment>
  );
}

HotkeysPreferences.propTypes = {
  onClose: PropTypes.func,
};

export { HotkeysPreferences };
