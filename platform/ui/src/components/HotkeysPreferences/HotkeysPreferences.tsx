import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import HotkeyField from '../HotkeyField';
import Typography from '../Typography';

/* TODO: Move these configs and utils to core? */
import { MODIFIER_KEYS } from './hotkeysConfig';
import { validate, splitHotkeyDefinitionsAndCreateTuples } from './utils';

const HotkeysPreferences = ({
  disabled = false,
  hotkeyDefinitions,
  errors: controlledErrors,
  onChange = () => {},
  hotkeysModule,
}) => {
  const { t } = useTranslation('UserPreferencesModal');

  const visibleHotkeys = Object.keys(hotkeyDefinitions)
    .filter(key => hotkeyDefinitions[key].isEditable)
    .reduce((obj, key) => {
      obj[key] = hotkeyDefinitions[key];
      return obj;
    }, {});

  const [errors, setErrors] = useState(controlledErrors);
  const splitedHotkeys = splitHotkeyDefinitionsAndCreateTuples(visibleHotkeys);

  if (!Object.keys(hotkeyDefinitions).length) {
    return t('No hotkeys found');
  }

  const onHotkeyChangeHandler = (id, definition) => {
    const { error } = validate({
      commandName: id,
      pressedKeys: definition.keys,
      hotkeys: hotkeyDefinitions,
    });

    setErrors(prevState => {
      const errors = { ...prevState, [id]: error };
      return errors;
    });

    onChange(id, definition, { ...errors, [id]: error });
  };

  return (
    <div className="flex flex-row justify-center">
      <div className="flex w-full flex-row justify-evenly">
        {splitedHotkeys.map((hotkeys, index) => {
          return (
            <div
              key={`HotkeyGroup@${index}`}
              className="flex flex-row"
            >
              <div className="flex flex-col p-2 text-right">
                {hotkeys.map((hotkey, hotkeyIndex) => {
                  const [id, definition] = hotkey;
                  const isFirst = hotkeyIndex === 0;
                  const error = errors[id];

                  const onChangeHandler = keys =>
                    onHotkeyChangeHandler(id, { ...definition, keys });

                  return (
                    <div
                      key={`HotkeyItem@${hotkeyIndex}`}
                      className="mb-2 flex flex-row justify-end"
                    >
                      <div className="flex flex-col items-center">
                        <Typography
                          variant="subtitle"
                          className={classNames(
                            'text-primary-light w-full pr-6 text-right',
                            !isFirst && 'hidden'
                          )}
                        >
                          {t('Function')}
                        </Typography>
                        <Typography
                          variant="subtitle"
                          className={classNames(
                            'flex h-full flex-row items-center whitespace-nowrap pr-6',
                            isFirst && 'mt-5'
                          )}
                        >
                          {definition.label}
                        </Typography>
                      </div>
                      <div className="flex flex-col">
                        <Typography
                          variant="subtitle"
                          className={classNames(
                            'text-primary-light pr-6 pl-0 text-left',
                            !isFirst && 'hidden'
                          )}
                        >
                          {t('Shortcut')}
                        </Typography>
                        <div className={classNames('flex w-32 flex-col', isFirst && 'mt-5')}>
                          <HotkeyField
                            disabled={disabled}
                            keys={definition.keys}
                            modifierKeys={MODIFIER_KEYS}
                            onChange={onChangeHandler}
                            hotkeys={hotkeysModule}
                            className="h-8 text-lg"
                          />
                          {error && (
                            <span className="p-2 text-left text-sm text-red-600">{error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

HotkeysPreferences.propTypes = {
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  hotkeyDefinitions: PropTypes.object.isRequired,
  hotkeysModule: PropTypes.shape({
    initialize: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired,
    unpause: PropTypes.func.isRequired,
    startRecording: PropTypes.func.isRequired,
    record: PropTypes.func.isRequired,
  }).isRequired,
};

export default HotkeysPreferences;
