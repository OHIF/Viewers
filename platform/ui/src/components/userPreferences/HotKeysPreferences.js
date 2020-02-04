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
 * HotkeysPreferences tab
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
function HotkeysPreferences({
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

  const splitedHotkeys = [];
  if (hasHotkeys) {
    const arrayHotkeys = Object.entries(state.hotkeys);
    const halfwayThrough = Math.ceil(arrayHotkeys.length / 2);
    splitedHotkeys.push(arrayHotkeys.slice(0, halfwayThrough));
    splitedHotkeys.push(
      arrayHotkeys.slice(halfwayThrough, arrayHotkeys.length)
    );
  }

  return (
    <React.Fragment>
      <div className="HotkeysPreferences">
        {hasHotkeys && (
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
                            allowed_keys={ALLOWED_KEYS}
                            handleChange={handleChange}
                            classNames={'hotkeyInput'}
                          ></HotkeyField>
                          <span className="errorMessage">{errorMessage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
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

HotkeysPreferences.propTypes = {
  hide: PropTypes.func,
  t: PropTypes.func,
  hotkeysManager: PropTypes.object,
};

export { HotkeysPreferences };
